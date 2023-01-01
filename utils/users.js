const users = [];







const dbConnect = require("../connection");


function getQueryResult(query) {
  return new Promise((resolve) => {
    dbConnect.query(query, function (err, result) {
      if (err) throw err;
      if (result.length != 0) {

        resolve(Object.assign({}, result[0]))
      }
      else {
        resolve(null)
      }
    });
  })
}

function getQueryMultipleResult(query) {
  return new Promise((resolve) => {
    dbConnect.query(query, function (err, result) {
      if (err) throw err;
      if (result.length != 0) {

        resolve(JSON.parse(JSON.stringify(result)))
      }
      else {
        resolve(null)
      }
    });
  })
}

function updateSqlQuery(updateQuery) {
  return new Promise((resolve) => {
    dbConnect.query(updateQuery, function (err, result) {
      if (err) throw err;
      resolve(result)
    });
  })
}

function deleteSqlQuery(deleteQuery) {
  return new Promise((resolve) => {
    dbConnect.query(deleteQuery, function (err, result) {
      if (err) throw err;
      resolve(result)
    });
  })
}



async function UserEmailMatch(email, created_by) {

  var selectQuery = "Select * from users where email ='" + email + "' "
  const contact = await getQueryResult(selectQuery)
  return contact;
}

/**
 * Contact List
 */

async function contactEmail(email, created_by) {

  var selectQuery = "Select * from contacts where email ='" + email + "' and created_by =" + created_by + " "
  const contact = await getQueryResult(selectQuery)
  return contact;
}


async function contactList(userId) {
  var selectQuery = "Select DISTINCT contacts.name,contacts.email,contacts.user_id,contacts.created_by,users.image as userImg,users.createdAt,users.location,(SELECT message from messages WHERE sender_id = " + userId + " ORDER BY id DESC LIMIT 1) as message,(SELECT file_upload from messages WHERE sender_id = " + userId + " ORDER BY id DESC LIMIT 1) as file_upload,(SELECT createdAt from messages WHERE sender_id = " + userId + " ORDER BY id DESC LIMIT 1) as created_at from contacts LEFT JOIN users ON users.id = contacts.user_id where contacts.created_by = " + userId + " order by contacts.name ASC"
  const users = await getQueryMultipleResult(selectQuery)
  return users;
}


async function searchContactData(name, userId) {
  var selectQuery = "Select DISTINCT contacts.name,contacts.email,contacts.user_id,contacts.created_by,users.image as userImg,users.createdAt,users.location,(SELECT message from messages WHERE sender_id = " + userId + " ORDER BY id DESC LIMIT 1) as message,(SELECT file_upload from messages WHERE sender_id = " + userId + " ORDER BY id DESC LIMIT 1) as file_upload,(SELECT createdAt from messages WHERE sender_id = " + userId + " ORDER BY id DESC LIMIT 1) as created_at from contacts LEFT JOIN users ON users.id = contacts.user_id where contacts.name LIKE '%" + name + "%' and contacts.created_by = " + userId + " order by contacts.name ASC"
  const users = await getQueryMultipleResult(selectQuery)
  return users;
}


async function lastMsg(userId, receiverId) {

  var selectQuery = "Select * from messages where (sender_id =" + userId + " and receiver_id =" + receiverId + ") or (sender_id =" + receiverId + " and receiver_id =" + userId + ") order by id desc limit 1"
  const contactList = await getQueryResult(selectQuery)
  return contactList;
}


async function EditlastMsg(userId, receiverId) {

  var selectQuery = "Select * from messages where (sender_id =" + userId + " and receiver_id =" + receiverId + ") or (sender_id =" + receiverId + " and receiver_id =" + userId + ") order by id desc limit 1"
  const contactList = await getQueryResult(selectQuery)
  return contactList;
}

/**
 * Single Chat
 */

async function messageSearchData(searchVal, user_id, receiverId) {
  var selectQuery = "Select messages.message, messages.sender_id, messages.receiver_id, messages.file_upload, messages.createdAt, users.id as user_id,users.name, users.image from messages INNER JOIN users ON users.id = messages.sender_id   where (messages.receiver_id =" + user_id + " or messages.sender_id =" + user_id + ") and (messages.receiver_id =" + receiverId + " or messages.sender_id =" + receiverId + ") and messages.message LIKE '%" + searchVal + "%' order by messages.id desc Limit 10"
  const message = await getQueryMultipleResult(selectQuery)
  return message;
}


async function receiverData(id) {

  var selectQuery = "Select * from users where id =" + id + " "
  const receiverData = await getQueryResult(selectQuery)
  return receiverData;
}


async function sendUnreadMsg(receiver_id) {

  var selectQuery = "Select * from messages where receiver_id =" + receiver_id + " and unread ='0' "
  const message = await getQueryResult(selectQuery)
  return message;
}


async function receiverMessage(id) {


































  var selectQuery = "Select messages.message, messages.sender_id, messages.receiver_id, messages.file_upload, messages.createdAt, users.id,users.name, users.image from messages JOIN users ON users.id = messages.sender_id where (messages.receiver_id =" + id + " or messages.sender_id =" + id + ")"
  const message = await getQueryResult(selectQuery)
  return message;
}


async function messageUpdate(id, message) {

  var updateQuery = "UPDATE messages SET message='" + message + "' where id =" + id + " "
  const message_update = await updateSqlQuery(updateQuery)
  return message_update;
}


async function userJoin(userId) {
















































  var selectQuery = "Select DISTINCT contacts.name, contacts.email, contacts.user_id, contacts.created_by, contacts.last_msg_date, messages.unread as unreadMsg, users.createdAt, users.location, users.image as userImg from contacts LEFT JOIN users ON users.id = contacts.user_id LEFT JOIN messages ON messages.sender_id = contacts.user_id   where contacts.created_by =" + userId + " order by messages.id desc"
  const users = await getQueryMultipleResult(selectQuery)
  return users;
}


async function userMessage(id, user_id, receiverId, startm) {




















































  var selectQuery = "Select DISTINCT messages.message, messages.sender_id, messages.receiver_id, messages.file_upload, messages.createdAt, messages.updatedAt, users.id as user_id,messages.id as id, users.image, contacts.name from messages LEFT JOIN users ON users.id = messages.sender_id LEFT JOIN contacts ON contacts.user_id = messages.sender_id where (messages.receiver_id =" + id + " or messages.sender_id =" + id + ") order by messages.id desc Limit 10"
  const message = await getQueryMultipleResult(selectQuery)
  return message;
}


async function updateUnreadMsg(receiver_Id, unread) {




  var updateQuery = "UPDATE messages SET unread=" + unread + " where sender_id =" + receiver_Id + " "
  const message_update = await updateSqlQuery(updateQuery)
  return message_update;
}


async function groupData(id) {

  var selectQuery = "Select * from groups where id =" + id + " "
  const group_data = await getQueryResult(selectQuery)
  return group_data;
}


async function groupById(groupsId) {



























  var selectQuery = "Select group_users.unread, group_users.is_admin, group_users.contact_id, group_users.group_id, users.id as user_id, users.name from group_users LEFT JOIN users ON users.id = group_users.contact_id  where group_users.group_id =" + groupsId + " "
  const contactList = await getQueryMultipleResult(selectQuery)
  return contactList;
}


async function groupContactsList(groupsId, userId) {










































  var selectQuery = "Select DISTINCT group_users.unread, group_users.is_admin, group_users.contact_id, group_users.group_id, users.id as user_id, users.name, contacts.name as contactName from group_users LEFT JOIN users ON users.id = group_users.contact_id LEFT JOIN contacts ON contacts.user_id = group_users.contact_id  where (group_users.group_id =" + groupsId + ") "
  const contactList = await getQueryMultipleResult(selectQuery)
  return contactList;
}


async function messageDelete(id) {

  var deleteQuery = "DELETE from messages WHERE id =" + id + " "
  const message_delete = await deleteSqlQuery(deleteQuery)
  return message_delete;
}

/**
 * Group Message
 */

async function searchGroupData(name, userId) {





























  var selectQuery = "Select group_users.unread, group_users.contact_id, group_users.group_id, groups.name, groups.description, groups.userId, groups.id from group_users LEFT JOIN groups ON groups.id = group_users.group_id where (groups.name LIKE '%" + name + "%') and (group_users.contact_id =" + userId + ") "
  const contactList = await getQueryMultipleResult(selectQuery)
  return contactList;
}


async function groupSearchData(name, id) {

  var selectQuery = "Select group_messages.message, group_messages.sender_id, group_messages.group_id, group_messages.file_upload, group_messages.createdAt, users.name, users.image  from group_messages LEFT JOIN users ON users.id = group_messages.sender_id where  (group_messages.group_id =" + id + ") and (group_messages.message LIKE '%" + name + "%') order by group_messages.id desc LIMIT 10 "
  const groupMessage = await getQueryMultipleResult(selectQuery)
  return groupMessage;
}


async function unreadGroupUser(groupsId) {

  var selectQuery = "Select * from group_users where group_id =" + groupsId + " "
  const unread_user = await getQueryResult(selectQuery)
  return unread_user;
}


async function updateUnreadGroupUser(groupsId, contactId, unread) {




  var updateQuery = "UPDATE group_users SET unread=" + unread + " where contact_id =" + contactId + " and group_id =" + groupsId + " "
  const message_update = await updateSqlQuery(updateQuery)
  return message_update;
}


async function groupsMessage(id, startm = 0) {































  var selectQuery = "Select group_messages.message,group_messages.id, group_messages.sender_id, group_messages.group_id, group_messages.file_upload, group_messages.createdAt, users.name, users.image from group_messages LEFT JOIN users ON users.id = group_messages.sender_id where (group_messages.group_id =" + id + ") order by group_messages.id desc LIMIT 10 "
  const groupMessage = await getQueryMultipleResult(selectQuery)
  return groupMessage;
}


async function groupMessageUpdate(id, message) {

  var updateQuery = "UPDATE group_messages SET message='" + message + "' where id =" + id + " "
  const message_update = await updateSqlQuery(updateQuery)
  return message_update;
}


async function contactListByUser(userId) {




























  var selectQuery = "Select DISTINCT group_users.unread, group_users.contact_id, groups.name, groups.description, groups.userId, groups.id as group_id from group_users INNER JOIN groups ON groups.id = group_users.group_id where group_users.contact_id =" + userId + " "
  const contactList = await getQueryMultipleResult(selectQuery)
  return contactList;
}


async function updateUnreadGroupMessage(groupsId, userId, unread) {




  var updateQuery = "UPDATE group_users SET unread=" + unread + " where contact_id =" + userId + " and group_id =" + groupsId + " "
  const message_update = await updateSqlQuery(updateQuery)
  return message_update;
}


async function updateAllUnreadGroupMessage(groupsId, unread) {




  var updateQuery = "UPDATE group_users SET unread=" + unread + " where group_id =" + groupsId + " "
  const message_update = await updateSqlQuery(updateQuery)
  return message_update;
}


async function groupFileDelete(id) {

  var deleteQuery = "DELETE from group_messages WHERE id =" + id + " "
  const message_delete = await deleteSqlQuery(deleteQuery)
  return message_delete;
}


async function groupDeleteMember(id, group_id) {

  var deleteQuery = "DELETE from group_users WHERE contact_id =" + id + " and group_id =" + group_id + " "
  const group_delete = await deleteSqlQuery(deleteQuery)
  return group_delete;
}


async function groupMemberDelete(id) {

  var deleteQuery = "DELETE from group_users WHERE group_id =" + id + " "
  const group_delete = await deleteSqlQuery(deleteQuery)
  return group_delete;
}


async function groupMsgDelete(id) {

  var deleteQuery = "DELETE from group_messages WHERE group_id =" + id + " "
  const group_delete = await deleteSqlQuery(deleteQuery)
  return group_delete;
}


async function groupDelete(id) {

  var deleteQuery = "DELETE from groups WHERE id =" + id + " "
  const group_delete = await deleteSqlQuery(deleteQuery)
  return group_delete;
}


async function deleteGroupUser(id, group_id) {




  var deleteQuery = "DELETE from group_users WHERE contact_id =" + id + " and group_id =" + group_id + " "
  const group_user_delete = await deleteSqlQuery(deleteQuery)
  return group_user_delete;
}


async function allGroupMessageDelete(id) {

  var deleteQuery = "DELETE from group_messages WHERE group_id =" + id + " "
  const group_delete = await deleteSqlQuery(deleteQuery)
  return group_delete;
}


async function singleGroupMessageDelete(contactId, groupId) {




  var deleteQuery = "DELETE from group_messages WHERE group_id =" + contactId + " and sender_id =" + groupId + " "
  const group_delete = await deleteSqlQuery(deleteQuery)
  return group_delete;
}


async function groupSenderMessage(groupId, contactId) {

  var selectQuery = "Select * from group_messages where group_id =" + groupId + " and sender_id =" + contactId + " "
  const group_msg = await getQueryMultipleResult(selectQuery)
  return group_msg;
}

/**
 * Setting
 */

async function currentUser(id) {

  var selectQuery = "Select * from users where id =" + id + " "
  const userInfo = await getQueryResult(selectQuery)
  return userInfo;
}


async function userNameUpdate(id, name) {

  var updateQuery = "UPDATE users SET name='" + name + "' where id =" + id + " "
  const message_update = await updateSqlQuery(updateQuery)
  return message_update;
}


async function receiverNameUpdate(userId, receiverId, name) {

  var updateQuery = "UPDATE contacts SET name='" + name + "' where created_by =" + userId + " and user_id =" + receiverId + " "
  const message_update = await updateSqlQuery(updateQuery)
  return message_update;
}


async function groupNameUpdate(id, name) {

  var updateQuery = "UPDATE groups SET name='" + name + "' where id =" + id + " "
  const message_update = await updateSqlQuery(updateQuery)
  return message_update;
}


async function notificationUpdate(id, notification) {

  var updateQuery = "UPDATE users SET notification=" + notification + " where id =" + id + " "
  const message_update = await updateSqlQuery(updateQuery)
  return message_update;
}


async function notificationMutedUpdate(id, is_muted) {

  var updateQuery = "UPDATE users SET is_muted=" + is_muted + " where id =" + id + " "
  const message_update = await updateSqlQuery(updateQuery)
  return message_update;
}


async function profileUpdate(id, image) {

  var updateQuery = "UPDATE users SET image='" + image + "' where id =" + id + " "
  const message_update = await updateSqlQuery(updateQuery)
  return message_update;
}

async function contactListByUserId(userId, created_by) {





























  var selectQuery = "Select contacts.name, contacts.email, contacts.user_id, contacts.created_by, users.image as userImg, users.createdAt, users.location from contacts JOIN users ON users.id = contacts.user_id where (users.id =" + userId + ") and (contacts.user_id =" + userId + ") and (contacts.created_by =" + created_by + ") "
  const users = await getQueryResult(selectQuery)
  return users;
}

async function lastMessageShow(userId) {







































  var selectQuery = "Select message,createdAt as created from messages where (receiver_id =" + userId + " or sender_id =" + userId + ") order by createdAt desc Limit 1"
  const messages = await getQueryResult(selectQuery)
  return messages;
}

async function lastMessageShow(userId) {

  var selectQuery = "Select message,createdAt as created from messages where (receiver_id =" + userId + " or sender_id =" + userId + ") order by createdAt desc Limit 1"
  const messages = await getQueryResult(selectQuery)
  return messages;
}

async function searchData(name, userId) {



































































  var selectQuery = "Select contacts.name, contacts.email, contacts.user_id, contacts.created_by, users.image as userImg, users.createdAt, users.location, messages.message, messages.file_upload, messages.unread as unreadMsg, messages.createdAt as created_at from contacts JOIN users ON users.id = contacts.user_id JOIN messages ON messages.sender_id = contacts.user_id where (users.id =" + userId + ") and (messages.sender_id =" + userId + ") and (contacts.created_by =" + userId + ") and contacts.name LIKE '%" + name + "%' order by messages.id desc "
  const users = await getQueryResult(selectQuery)
  return users;
}


async function contactDelete(receiverId, userId) {

  var deleteQuery = "DELETE from contacts WHERE user_id IN (" + receiverId + "," + userId + ") and created_by IN (" + userId + "," + receiverId + ")"
  const contact_delete = await deleteSqlQuery(deleteQuery)
  return contact_delete;
}


async function allMessageDelete(id, uid) {

  var deleteQuery = "DELETE from messages WHERE (receiver_id =" + id + " and sender_id =" + uid + ") or (sender_id =" + id + " and receiver_id =" + uid + ") "
  const message_delete = await deleteSqlQuery(deleteQuery)
  return message_delete;
}


async function allSenderMessageDelete(id) {

  var deleteQuery = "DELETE from messages WHERE sender_id =" + id + " "
  const message_delete = await deleteSqlQuery(deleteQuery)
  return message_delete;
}

/**
 * Group List
 */
async function groupContactById(contactId) {

  var selectQuery = "Select * from users where id =" + contactId + " "
  const groupdetail = await getQueryResult(selectQuery)
  return groupdetail;
}

async function unreadGroupMessage(groupsId) {

  var selectQuery = "Select * from group_messages where group_id =" + groupsId + " and unread ='0' "
  const group_message = await getQueryResult(selectQuery)
  return group_message;
}

/**
 * Remove Single Message
 */
async function groupMessageDelete(id) {

  var deleteQuery = "DELETE from group_messages WHERE id =" + id + " "
  const message_delete = await deleteSqlQuery(deleteQuery)
  return message_delete;
}

async function groupByGroupUser(groupsIds, contacts) {











  var selectQuery = "Select * from group_users where group_id =" + contacts[0].groupId + " and contact_id =" + contacts[0].contactId + " "
  const groups1 = await getQueryResult(selectQuery)
  return groups1;
}

async function groupsList(contactId, unread) {
  const group_user = await Groups.aggregate([
    { $match: { $expr: { $eq: ["$_id", { $toObjectId: contactId }] } } },
    {
      $project: {
        name: "$name",
        description: "$description",
      },
    },
  ]);
  return group_user;
}


async function currentUsergroupList(userId) {

  var selectQuery = "Select * from groups where userId =" + userId + " "
  const group_user = await getQueryResult(selectQuery)
  return group_user;
}

/**
 * Update Notification
 */

async function userLeave({ id = 16 }) {

  var updateQuery = "UPDATE users SET active='false' where id =" + id + " "
  const user = await updateSqlQuery(updateQuery)
  return user;
}

module.exports = {
  UserEmailMatch,
  contactEmail,
  contactListByUserId,
  contactList,
  searchContactData,
  lastMsg,
  EditlastMsg,
  contactDelete,
  allMessageDelete,
  allSenderMessageDelete,
  messageSearchData,
  receiverData,
  sendUnreadMsg,
  receiverMessage,
  messageUpdate,
  userJoin,
  userMessage,
  updateUnreadMsg,
  groupData,
  groupById,
  groupContactsList,
  messageDelete,
  searchGroupData,
  groupSearchData,
  unreadGroupUser,
  updateUnreadGroupUser,
  groupsMessage,
  groupMessageUpdate,
  contactListByUser,
  updateUnreadGroupMessage,
  updateAllUnreadGroupMessage,
  groupFileDelete,
  groupDeleteMember,
  groupDelete,
  groupMemberDelete,
  groupMsgDelete,
  deleteGroupUser,
  allGroupMessageDelete,
  singleGroupMessageDelete,
  groupSenderMessage,
  currentUser,
  userNameUpdate,
  receiverNameUpdate,
  groupNameUpdate,
  notificationUpdate,
  notificationMutedUpdate,
  profileUpdate,
  userLeave
};
