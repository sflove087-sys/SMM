// =========================================================================
// FinPay - Google Apps Script Backend
// =========================================================================

// --- GLOBAL CONFIGURATION ---
const SCRIPT_PROPERTIES = PropertiesService.getScriptProperties();
const USERS_SHEET_NAME = SCRIPT_PROPERTIES.getProperty('USERS_SHEET_NAME') || 'Users';
const TRANSACTIONS_SHEET_NAME = SCRIPT_PROPERTIES.getProperty('TRANSACTIONS_SHEET_NAME') || 'Transactions';
const SETTINGS_SHEET_NAME = SCRIPT_PROPERTIES.getProperty('SETTINGS_SHEET_NAME') || 'Settings';
const OTP_EXPIRATION_SECONDS = 300; // 5 minutes

// Define constants for column indices
const USER_COLS = { ID: 1, MOBILE: 2, PIN: 3, NAME: 4, EMAIL: 5, USER_TYPE: 6, BALANCE: 7, IS_ACTIVE: 8, DAILY_TOTAL: 9, MONTHLY_TOTAL: 10, LAST_LOGIN: 11, DEVICE_ID: 12, PHOTO_BASE64: 13 };
const TRANSACTION_COLS = { ID: 1, TYPE: 2, AMOUNT: 3, STATUS: 4, TIMESTAMP: 5, FROM_ID: 6, TO_ID: 7, FROM_NAME: 8, TO_NAME: 9, FROM_MOBILE: 10, TO_MOBILE: 11, DESC: 12 };

// =========================================================================
// MAIN ENTRY POINT (ROUTER)
// =========================================================================
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    initializeDataSheets(); 

    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const payload = request.payload || {};

    switch (action) {
      // AUTH
      case 'login':
        return createSuccessResponse(handleLogin(payload));
      case 'registerUser':
        return createSuccessResponse(handleRegisterUser(payload));
      case 'requestOtp':
        return createSuccessResponse(handleRequestOtp(payload));
      case 'verifyOtp':
        return createSuccessResponse(handleVerifyOtp(payload));
      case 'resetPin':
        return createSuccessResponse(handleResetPin(payload));

      // DATA
      case 'getCurrentUser':
        return createSuccessResponse(handleGetCurrentUser(payload));
      case 'getUserByMobile':
        return createSuccessResponse(handleGetUserByMobile(payload));
      case 'getTransactionHistory':
        return createSuccessResponse(handleGetTransactionHistory(payload));
      case 'performTransaction':
        return createSuccessResponse(handlePerformTransaction(payload));
      case 'updateProfile':
        return createSuccessResponse(handleUpdateProfile(payload));
      case 'getContacts':
        return createSuccessResponse(handleGetContacts(payload));
      
      // AGENT
      case 'getPendingRequests':
        return createSuccessResponse(handleGetPendingRequests(payload));
      case 'updateRequestStatus':
        return createSuccessResponse(handleUpdateRequestStatus(payload));
      case 'getTodaysSummary':
        return createSuccessResponse(handleGetTodaysSummary(payload));

      // ADMIN
      case 'getAllUsers':
        return createSuccessResponse(handleGetAllUsers(payload));
      case 'toggleUserStatus':
        return createSuccessResponse(handleToggleUserStatus(payload));
      case 'getSystemSettings':
        return createSuccessResponse(handleGetSystemSettings(payload));
      case 'updateSystemSettings':
        return createSuccessResponse(handleUpdateSystemSettings(payload));

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    Logger.log(`Error in doPost: ${error.toString()} \nStack: ${error.stack} \nPayload: ${e.postData.contents}`);
    return createErrorResponse(error.message);
  } finally {
    lock.releaseLock();
  }
}


// =========================================================================
// RESPONSE HELPERS
// =========================================================================
function createSuccessResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, data: data })).setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, message: message })).setMimeType(ContentService.MimeType.JSON);
}

// =========================================================================
// ACTION HANDLERS
// =========================================================================

/** Handles user login. */
function handleLogin(payload) {
  const { mobile, pin } = payload;
  const usersSheet = getSheet(USERS_SHEET_NAME);
  const userRow = findRow(usersSheet, USER_COLS.MOBILE, mobile);
  
  if (!userRow) throw new Error("Invalid mobile number or PIN.");

  let user = sheetToUser(userRow.data);
  // Compare PINs as strings to avoid type mismatch (e.g., 1234 vs "1234")
  if (user.pin.toString() !== pin.toString()) throw new Error("Invalid mobile number or PIN.");
  if (!user.isActive) throw new Error("This account has been blocked.");
  
  usersSheet.getRange(userRow.row, USER_COLS.LAST_LOGIN).setValue(new Date());
  
  const lastLoginDate = new Date(user.lastLogin);
  const now = new Date();
  if (lastLoginDate.getDate() !== now.getDate()) {
      usersSheet.getRange(userRow.row, USER_COLS.DAILY_TOTAL).setValue(0);
  }
  if (lastLoginDate.getMonth() !== now.getMonth()) {
      usersSheet.getRange(userRow.row, USER_COLS.MONTHLY_TOTAL).setValue(0);
  }

  user.lastLogin = new Date();
  return user;
}

/** Registers a new user. */
function handleRegisterUser(payload) {
    const { name, mobile, pin, email } = payload;
    const usersSheet = getSheet(USERS_SHEET_NAME);

    if (findRow(usersSheet, USER_COLS.MOBILE, mobile)) {
        throw new Error("A user with this mobile number already exists.");
    }

    const newUser = {
        id: 'u' + Date.now(),
        mobile: mobile,
        pin: pin,
        name: name,
        email: email || '',
        userType: 'PERSONAL',
        balance: 0,
        isActive: true,
        dailyTransactionTotal: 0,
        monthlyTransactionTotal: 0,
        lastLogin: new Date(),
        deviceId: null,
        photoBase64: null
    };

    const newRow = userToSheet(newUser);
    usersSheet.appendRow(newRow);
    return newUser;
}

/** Performs a transaction between two users or creates a pending request. */
function handlePerformTransaction(payload) {
  const { type, toMobile, amount, pin, userId, reference } = payload;
  const usersSheet = getSheet(USERS_SHEET_NAME);
  const settings = handleGetSystemSettings();

  const fromUserRow = findRow(usersSheet, USER_COLS.ID, userId);
  if (!fromUserRow) throw new Error("Sender not found.");
  const fromUser = sheetToUser(fromUserRow.data);
  
  if (fromUser.pin.toString() !== pin.toString()) throw new Error("Incorrect PIN.");

  const toUserRow = findRow(usersSheet, USER_COLS.MOBILE, toMobile);
  if (!toUserRow && type !== 'MOBILE_RECHARGE') throw new Error("Recipient not found.");
  const toUser = toUserRow ? sheetToUser(toUserRow.data) : null;

  if (toUser && fromUser.id === toUser.id) throw new Error("Cannot transact with yourself.");

  // For Money Requests, just log the pending transaction and return.
  if (type === 'REQUEST_MONEY') {
    if (fromUser.userType !== 'PERSONAL' || (toUser && toUser.userType !== 'AGENT')) {
      throw new Error("Money can only be requested from an Agent by a Personal user.");
    }
    const requestTransaction = {
      id: `t${Date.now()}`, type, amount, status: 'PENDING', timestamp: new Date(),
      fromUserId: fromUser.id, toUserId: toUser.id,
      fromUserName: fromUser.name, toUserName: toUser.name,
      fromUserMobile: fromUser.mobile, toUserMobile: toUser.mobile,
      description: reference || `Request from ${fromUser.name}`
    };
    getSheet(TRANSACTIONS_SHEET_NAME).appendRow(transactionToSheet(requestTransaction));
    return requestTransaction;
  }
  
  // --- Standard Transaction Logic ---
  let debitorRow = fromUserRow;
  let debitor = fromUser;
  let creditorRow = toUserRow;
  let creditor = toUser;

  // SPECIAL CASE: Agent Cashing IN to a Personal user.
  if (type === 'CASH_IN' && fromUser.userType === 'AGENT') {
      // Standard flow is correct: Agent is debitor, Personal is creditor.
  }
  
  // 1. Check debitor's balance
  if (debitor.balance < amount) throw new Error("Insufficient balance for the transaction.");

  // 2. Apply transaction limits to the initiator (original fromUser)
  if(fromUser.userType === 'PERSONAL' && (fromUser.dailyTransactionTotal + amount > settings.personalDailyLimit)) throw new Error('Daily transaction limit exceeded.');
  if(fromUser.userType === 'PERSONAL' && (fromUser.monthlyTransactionTotal + amount > settings.personalMonthlyLimit)) throw new Error('Monthly transaction limit exceeded.');
  
  // Update initiator's totals
  usersSheet.getRange(fromUserRow.row, USER_COLS.DAILY_TOTAL).setValue(fromUser.dailyTransactionTotal + amount);
  usersSheet.getRange(fromUserRow.row, USER_COLS.MONTHLY_TOTAL).setValue(fromUser.monthlyTransactionTotal + amount);


  // 3. Perform the balance update
  usersSheet.getRange(debitorRow.row, USER_COLS.BALANCE).setValue(debitor.balance - amount);
  if (creditorRow) { // creditorRow will be null for mobile recharge
      usersSheet.getRange(creditorRow.row, USER_COLS.BALANCE).setValue(creditor.balance + amount);
  }
  
  // 4. Log the transaction
  const newTransaction = {
      id: `t${Date.now()}`, type, amount, status: 'SUCCESSFUL', timestamp: new Date(),
      fromUserId: fromUser.id, toUserId: toUser ? toUser.id : 'system_recharge',
      fromUserName: fromUser.name, toUserName: toUser ? toUser.name : `Recharge`,
      fromUserMobile: fromUser.mobile, toUserMobile: toMobile,
      description: reference || `${type.replace('_', ' ')}`
  };
  getSheet(TRANSACTIONS_SHEET_NAME).appendRow(transactionToSheet(newTransaction));
  
  return newTransaction;
}


/** Retrieves transaction history for a user. */
function handleGetTransactionHistory(payload) {
  const { userId } = payload;
  const sheet = getSheet(TRANSACTIONS_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  data.shift();

  return data.map(sheetToTransaction)
    .filter(tx => tx.fromUserId === userId || tx.toUserId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/** Gets all users (for admin panel). */
function handleGetAllUsers() {
    const sheet = getSheet(USERS_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    data.shift();
    return data.map(sheetToUser).filter(u => u.userType !== 'ADMIN');
}

/** Toggles a user's active status. */
function handleToggleUserStatus(payload) {
    const { userIdToToggle } = payload;
    const sheet = getSheet(USERS_SHEET_NAME);
    const userRow = findRow(sheet, USER_COLS.ID, userIdToToggle);
    if (!userRow) throw new Error("User not found.");

    const currentStatus = userRow.data[USER_COLS.IS_ACTIVE - 1];
    sheet.getRange(userRow.row, USER_COLS.IS_ACTIVE).setValue(!currentStatus);
    
    const updatedUser = sheetToUser(sheet.getRange(userRow.row, 1, 1, sheet.getLastColumn()).getValues()[0]);
    return updatedUser;
}

/** Retrieves system settings. */
function handleGetSystemSettings() {
    const sheet = getSheet(SETTINGS_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const settings = {};
    data.forEach(row => {
        settings[row[0]] = !isNaN(row[1]) ? Number(row[1]) : row[1];
    });
    return settings;
}

/** Updates system settings. */
function handleUpdateSystemSettings(payload) {
    const { settings } = payload;
    const sheet = getSheet(SETTINGS_SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    data.forEach((row, index) => {
        const key = row[0];
        if (settings.hasOwnProperty(key)) {
            sheet.getRange(index + 1, 2).setValue(settings[key]);
        }
    });
    return handleGetSystemSettings();
}

/** Finds a user by mobile number. */
function handleGetUserByMobile(payload) {
    const { mobile } = payload;
    const usersSheet = getSheet(USERS_SHEET_NAME);
    const userRow = findRow(usersSheet, USER_COLS.MOBILE, mobile);
    return userRow ? sheetToUser(userRow.data) : null;
}

/** Resets a user's PIN. */
function handleResetPin(payload) {
    const { mobile, newPin } = payload;
    const usersSheet = getSheet(USERS_SHEET_NAME);
    const userRow = findRow(usersSheet, USER_COLS.MOBILE, mobile);
    if (!userRow) throw new Error("User not found.");
    usersSheet.getRange(userRow.row, USER_COLS.PIN).setValue(newPin);
    return true;
}

/** Gets the currently logged-in user's data. */
function handleGetCurrentUser(payload) {
  const { userId } = payload;
  const usersSheet = getSheet(USERS_SHEET_NAME);
  const userRow = findRow(usersSheet, USER_COLS.ID, userId);
  if (!userRow) throw new Error("Current user not found.");
  
  return sheetToUser(userRow.data);
}

/** Updates user profile information. */
function handleUpdateProfile(payload) {
  const { userId, name, photoBase64 } = payload;
  const usersSheet = getSheet(USERS_SHEET_NAME);
  const userRow = findRow(usersSheet, USER_COLS.ID, userId);
  if (!userRow) throw new Error("User not found.");
  
  if (name) {
    usersSheet.getRange(userRow.row, USER_COLS.NAME).setValue(name);
  }
  if (photoBase64) {
    usersSheet.getRange(userRow.row, USER_COLS.PHOTO_BASE64).setValue(photoBase64);
  }
  
  // Return the fully updated user object
  return handleGetCurrentUser({ userId: userId });
}

/** Fetches a list of potential contacts for transactions. */
function handleGetContacts(payload) {
  const { userId, recipientType } = payload;
  const sheet = getSheet(USERS_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  data.shift(); // remove headers

  return data.map(sheetToUser)
    .filter(function(u) {
      return u.userType === recipientType && u.id !== userId && u.isActive;
    });
}

/** Gets pending money requests for an agent. */
function handleGetPendingRequests(payload) {
  const { userId } = payload; // Agent's ID
  const sheet = getSheet(TRANSACTIONS_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  data.shift();

  return data.map(sheetToTransaction)
    .filter(tx => tx.toUserId === userId && tx.type === 'REQUEST_MONEY' && tx.status === 'PENDING')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/** Updates the status of a money request (Approve/Decline). */
function handleUpdateRequestStatus(payload) {
  const { transactionId, status, pin, userId } = payload; // userId is the agent
  const txSheet = getSheet(TRANSACTIONS_SHEET_NAME);
  const usersSheet = getSheet(USERS_SHEET_NAME);

  const txRow = findRow(txSheet, TRANSACTION_COLS.ID, transactionId);
  if (!txRow) throw new Error("Transaction not found.");
  const tx = sheetToTransaction(txRow.data);

  if (tx.toUserId !== userId || tx.status !== 'PENDING') {
    throw new Error("Invalid request or permission denied.");
  }
  
  if (status === 'SUCCESSFUL') {
    const agentRow = findRow(usersSheet, USER_COLS.ID, userId);
    if (!agentRow) throw new Error("Agent account not found.");
    const agent = sheetToUser(agentRow.data);

    if (agent.pin.toString() !== pin.toString()) throw new Error("Incorrect PIN.");
    if (agent.balance < tx.amount) throw new Error("Insufficient agent balance to approve request.");

    const customerRow = findRow(usersSheet, USER_COLS.ID, tx.fromUserId);
    if (!customerRow) throw new Error("Customer account not found.");
    const customer = sheetToUser(customerRow.data);
    
    // Perform balance update
    usersSheet.getRange(agentRow.row, USER_COLS.BALANCE).setValue(agent.balance - tx.amount);
    usersSheet.getRange(customerRow.row, USER_COLS.BALANCE).setValue(customer.balance + tx.amount);
  }

  // Update transaction status for both SUCCESSFUL and FAILED
  txSheet.getRange(txRow.row, TRANSACTION_COLS.STATUS).setValue(status);
  
  const updatedTx = sheetToTransaction(txSheet.getRange(txRow.row, 1, 1, txSheet.getLastColumn()).getValues()[0]);
  return updatedTx;
}

/** Gets the daily summary for an agent. */
function handleGetTodaysSummary(payload) {
  const { userId } = payload; // Agent's ID
  const sheet = getSheet(TRANSACTIONS_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  data.shift();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalCashInAmount = 0;
  let totalCashInCount = 0;
  let totalCashOutAmount = 0;
  let totalCashOutCount = 0;

  data.map(sheetToTransaction)
    .filter(function(tx) {
      const txDate = new Date(tx.timestamp);
      txDate.setHours(0, 0, 0, 0);
      return txDate.getTime() === today.getTime() && tx.status === 'SUCCESSFUL';
    })
    .forEach(function(tx) {
      // 'CASH_IN': Agent's balance decreases. Agent is 'from'. Agent takes cash from customer.
      if (tx.type === 'CASH_IN' && tx.fromUserId === userId) {
        totalCashInAmount += tx.amount;
        totalCashInCount++;
      }
      // 'CASH_OUT': Agent's balance increases. Agent is 'to'. Agent gives cash to customer.
      if (tx.type === 'CASH_OUT' && tx.toUserId === userId) {
        totalCashOutAmount += tx.amount;
        totalCashOutCount++;
      }
    });

  return { totalCashInAmount: totalCashInAmount, totalCashInCount: totalCashInCount, totalCashOutAmount: totalCashOutAmount, totalCashOutCount: totalCashOutCount };
}


// =========================================================================
// OTP HANDLERS
// =========================================================================

/** Generates and stores an OTP for a mobile number. */
function handleRequestOtp(payload) {
    const { mobile } = payload;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const cache = CacheService.getScriptCache();
    cache.put(`otp_${mobile}`, otp, OTP_EXPIRATION_SECONDS);
    // In a real app, you would send this OTP via SMS. For demo, we return it.
    return { otpForDemo: otp };
}

/** Verifies an OTP. */
function handleVerifyOtp(payload) {
    const { mobile, otp } = payload;
    const cache = CacheService.getScriptCache();
    const storedOtp = cache.get(`otp_${mobile}`);
    return storedOtp != null && storedOtp == otp;
}


// =========================================================================
// SPREADSHEET UTILITIES
// =========================================================================

function getSheet(sheetName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
    }
  }
  return sheet;
}

function initializeDataSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (!ss.getSheetByName(USERS_SHEET_NAME)) {
    const userHeaders = ["id", "mobile", "pin", "name", "email", "userType", "balance", "isActive", "dailyTransactionTotal", "monthlyTransactionTotal", "lastLogin", "deviceId", "photoBase64"];
    const usersSheet = getSheet(USERS_SHEET_NAME, userHeaders);
    usersSheet.appendRow(["admin", "admin", "admin", "Admin User", "", "ADMIN", 0, true, 0, 0, new Date(), null, null]);
  }
  
  if (!ss.getSheetByName(TRANSACTIONS_SHEET_NAME)) {
    const transactionHeaders = ["id", "type", "amount", "status", "timestamp", "fromUserId", "toUserId", "fromUserName", "toUserName", "fromUserMobile", "toUserMobile", "description"];
    getSheet(TRANSACTIONS_SHEET_NAME, transactionHeaders);
  }
  
  if (!ss.getSheetByName(SETTINGS_SHEET_NAME)) {
      const settingsSheet = getSheet(SETTINGS_SHEET_NAME, ["key", "value"]);
      settingsSheet.appendRow(["personalDailyLimit", 25000]);
      settingsSheet.appendRow(["personalMonthlyLimit", 100000]);
      settingsSheet.appendRow(["agentCashHandlingLimit", 500000]);
      settingsSheet.appendRow(["otpRules", "Required for registration and PIN reset"]);
  }
}

function findRow(sheet, colIndex, value) {
  const data = sheet.getRange(2, colIndex, sheet.getLastRow() - 1, 1).getValues(); // Start from row 2
  for (let i = 0; i < data.length; i++) {
    if (data[i][0].toString() == value.toString()) {
      const rowIndex = i + 2;
      const rowData = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
      return { row: rowIndex, data: rowData };
    }
  }
  return null;
}


// =========================================================================
// DATA MAPPING UTILITIES
// =========================================================================

function sheetToUser(row) {
    return {
        id: row[USER_COLS.ID - 1],
        mobile: row[USER_COLS.MOBILE - 1],
        pin: row[USER_COLS.PIN - 1],
        name: row[USER_COLS.NAME - 1],
        email: row[USER_COLS.EMAIL - 1],
        userType: row[USER_COLS.USER_TYPE - 1],
        balance: parseFloat(row[USER_COLS.BALANCE - 1] || 0),
        isActive: row[USER_COLS.IS_ACTIVE - 1],
        dailyTransactionTotal: parseFloat(row[USER_COLS.DAILY_TOTAL - 1] || 0),
        monthlyTransactionTotal: parseFloat(row[USER_COLS.MONTHLY_TOTAL - 1] || 0),
        lastLogin: row[USER_COLS.LAST_LOGIN - 1] ? new Date(row[USER_COLS.LAST_LOGIN - 1]) : new Date(),
        deviceId: row[USER_COLS.DEVICE_ID - 1],
        photoBase64: row[USER_COLS.PHOTO_BASE64 - 1] || null,
    };
}

function userToSheet(user) {
    const row = [];
    row[USER_COLS.ID - 1] = user.id;
    row[USER_COLS.MOBILE - 1] = user.mobile;
    row[USER_COLS.PIN - 1] = user.pin;
    row[USER_COLS.NAME - 1] = user.name;
    row[USER_COLS.EMAIL - 1] = user.email;
    row[USER_COLS.USER_TYPE - 1] = user.userType;
    row[USER_COLS.BALANCE - 1] = user.balance;
    row[USER_COLS.IS_ACTIVE - 1] = user.isActive;
    row[USER_COLS.DAILY_TOTAL - 1] = user.dailyTransactionTotal;
    row[USER_COLS.MONTHLY_TOTAL - 1] = user.monthlyTransactionTotal;
    row[USER_COLS.LAST_LOGIN - 1] = user.lastLogin;
    row[USER_COLS.DEVICE_ID - 1] = user.deviceId;
    row[USER_COLS.PHOTO_BASE64 - 1] = user.photoBase64;
    return row;
}

function sheetToTransaction(row) {
    return {
        id: row[TRANSACTION_COLS.ID - 1],
        type: row[TRANSACTION_COLS.TYPE - 1],
        amount: parseFloat(row[TRANSACTION_COLS.AMOUNT - 1]),
        status: row[TRANSACTION_COLS.STATUS - 1],
        timestamp: new Date(row[TRANSACTION_COLS.TIMESTAMP - 1]),
        fromUserId: row[TRANSACTION_COLS.FROM_ID - 1],
        toUserId: row[TRANSACTION_COLS.TO_ID - 1],
        fromUserName: row[TRANSACTION_COLS.FROM_NAME - 1],
        toUserName: row[TRANSACTION_COLS.TO_NAME - 1],
        fromUserMobile: row[TRANSACTION_COLS.FROM_MOBILE - 1],
        toUserMobile: row[TRANSACTION_COLS.TO_MOBILE - 1],
        description: row[TRANSACTION_COLS.DESC - 1]
    };
}

function transactionToSheet(tx) {
    const row = [];
    row[TRANSACTION_COLS.ID - 1] = tx.id;
    row[TRANSACTION_COLS.TYPE - 1] = tx.type;
    row[TRANSACTION_COLS.AMOUNT - 1] = tx.amount;
    row[TRANSACTION_COLS.STATUS - 1] = tx.status;
    row[TRANSACTION_COLS.TIMESTAMP - 1] = tx.timestamp;
    row[TRANSACTION_COLS.FROM_ID - 1] = tx.fromUserId;
    row[TRANSACTION_COLS.TO_ID - 1] = tx.toUserId;
    row[TRANSACTION_COLS.FROM_NAME - 1] = tx.fromUserName;
    row[TRANSACTION_COLS.TO_NAME - 1] = tx.toUserName;
    row[TRANSACTION_COLS.FROM_MOBILE - 1] = tx.fromUserMobile;
    row[TRANSACTION_COLS.TO_MOBILE - 1] = tx.toUserMobile;
    row[TRANSACTION_COLS.DESC - 1] = tx.description;
    return row;
}