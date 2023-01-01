const mongoose = require("mongoose");
const dbConnect = require("./connection");
const express = require('express');
const fileUpload = require('express-fileupload');
const dotenv = require("dotenv");
const app = require("./auth");
const Msg = require("./models/messagesModel");
const Contact = require('./models/contactModel');
const Groups = require('./models/groupModel');
const groupMsg = require('./models/groupMessageModel');
const GroupUsers = require('./models/groupUserModel');
var fs = require('fs');
var bodyParser = require('body-parser');
var request = require('request');
const users = {};
const path = require('path');
const {
  UserEmailMatch,
  contactEmail,
  contactListByUserId,
  contactList,
  searchContactData,
  lastMsg,
  contactDelete,
  allMessageDelete,
  allSenderMessageDelete,
  messageSearchData,
  receiverData,
  sendUnreadMsg,
  receiverMessage,
  messageUpdate,
  EditlastMsg,
  userJoin,
  userMessage,
  updateUnreadMsg,
  groupById,
  groupContactsList,
  groupData,
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
  groupDelete,
  groupMemberDelete,
  groupMsgDelete,
  groupDeleteMember,
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
} = require('./utils/users');
const { log } = require("console");
dotenv.config({ path: "./config.env" });

/* ---------for Local database connection---------- */
const DB = process.env.DATABASE_LOCAL;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Socket
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.use(express.static(__dirname + "/public"));

const activeUsers = new Set();

// **************** * / video call functionality ************************
let vausers = [];
function findUser(username) {
  for (let i = 0; i < vausers.length; i++) {
    if (vausers[i].username == username)
      return vausers[i]
  }
}
// **************** * / video call functionality ************************

io.on("connection", (socket) => {
  console.log("new user Connected...");

  //**************** */ video call functionality ************************
  socket.on('isbusy', (rid) => {
    for (const key in users) {
      if (rid == users[key]) {
        io.to(key).emit("itbusy");
      }
    }
  })

  socket.on('cutphone', (uid) => {
    for (const key in users) {
      if (uid == users[key]) {
        io.to(key).emit("cutphoness");
      }
    }
  })

  socket.on('cutanswerd', (rsid) => {
    for (const key in users) {
      if (rsid == users[key]) {
        io.to(key).emit("cutpeeranswer");
      }
    }
  })

  socket.on('answerd', (rspid, ctype) => {
    for (const key in users) {
      if (rspid == users[key]) {
        io.to(key).emit("answered", rspid, ctype);
      }
    }
  })

  socket.on('ringcall', (uid, scid, name, image, ctype) => {
    for (const key in users) {
      if (uid == users[key]) {
        io.to(key).emit("ringcalling", uid, scid, name, image, ctype)
      }
    }

  })

  socket.on('vccallmsg', (message) => {
    const data = JSON.parse(message)
    const user = findUser(data.username)

    switch (data.type) {
      case "store_user":
        if (user != null) {
          return
        }
        const newUser = {
          conn: socket.id,
          username: data.username
        }
        vausers.push(newUser)
        break
      case "store_offer":
        if (user == null)
          return
        user.offer = data.offer
        break
      case "store_candidate":
        if (user == null) {
          return
        }
        if (user.candidates == null)
          user.candidates = []
        user.candidates.push(data.candidate)
        break
      case "send_answer":
        if (user == null) {
          return
        }
        sendData({
          type: "answer",
          answer: data.answer
        }, user.conn)
        break
      case "send_candidate":
        if (user == null) {
          return
        }

        sendData({
          type: "candidate",
          candidate: data.candidate
        }, user.conn)
        break
      case "join_call":
        if (user == null) {
          return
        }

        sendData({
          type: "offer",
          offer: user.offer
        }, socket.id)
        user.candidates.forEach(candidate => {
          sendData({
            type: "candidate",
            candidate: candidate
          }, socket.id)
        })
        break
    }
  })

  socket.on('closevc', (sameid) => {
    for (const key in users) {
      if (sameid == users[key]) {
        io.to(key).emit("cutvc");
      }
    }
    vausers.forEach(user => {
      if (user.conn == socket.id) {
        vausers.splice(vausers.indexOf(user), 1)
        return
      }
    })
  })

  function sendData(data, conn) {
    io.to(conn).emit('getingonmsgs', JSON.stringify(data))
  }

  //**************** */ video call functionality ************************
  /* Contacts */
  // Contacts List
  socket.on('editandupdate', function (userid) {
    contactList(userid).then((contacts) => {
      contacts.forEach(contact => {
        for (const key in users) {
          if (contact.created_by == users[key]) {
            io.to(key).emit('contactsLists', { contacts: contacts });
          }
        }
      });
    });
  });

  // common query for update data
  function insertSqlQuery(insertQuery) {
    return new Promise((resolve) => {
      dbConnect.query(insertQuery, function (err, result) {
        if (err) throw err;
        resolve(Object.assign({}, result))
      });
    })
  }

  function getQueryResult(query) {
    return new Promise((resolve) => {
      dbConnect.query(query, function (err, result) {
        if (err) throw err;
        if (result.length != 0) {
          // console.log(JSON.parse(JSON.stringify(result)))
          resolve(Object.assign({}, result[0]))
        } else {
          resolve(null)
        }
      });
    })
  }

  function updateSqlQuery(updateQuery) {
    return new Promise((resolve) => {
      dbConnect.query(updateQuery, function (err, result) {
        if (err) throw err;
      });
    })
  }


  socket.on("contactList", function ({ name, email, userEmail, created_by, username }) {
    UserEmailMatch(email, created_by).then((emailData) => {
      if (emailData != null) {
        if (emailData.email != userEmail) {
          contactEmail(email, created_by).then((contactData) => {
            if (contactData == null) {
              var user_id = emailData.id;
              let contact_list = [{ 'name': name, 'email': email, 'user_id': user_id, 'created_by': created_by }, { 'name': username, 'email': userEmail, 'user_id': created_by, 'created_by': user_id }];
              io.to(socket.id).emit("Success", { 'msg': 'Contact added successfully' });

              contact_list.forEach(async element => {
                // const contact = new Contact(element);
                var insertQuery = "INSERT INTO contacts(name, email, user_id, created_by) VALUES('" + element.name + "', '" + element.email + "', '" + element.user_id + "', '" + element.created_by + "')"
                const contact = await insertSqlQuery(insertQuery)
                  .then(() => {
                    contactList(created_by).then((contacts) => {
                      contacts.forEach(contact => {
                        for (const key in users) {
                          if (contact.created_by == users[key]) {
                            io.to(key).emit('contactsLists', { contacts: contacts });
                          }
                        }
                      });
                    });

                    userJoin(created_by).then((res) => {
                      for (const key in users) {
                        if (created_by == users[key]) {
                          io.to(key).emit('roomUsers', { users: res });
                        }
                      }
                    });

                    setTimeout(() => {
                      contactList(created_by).then((contacts) => {
                        contacts.forEach(contact => {
                          for (const key in users) {
                            if (created_by == users[key]) {
                              io.to(key).emit('contactsLists', { contacts: contacts });
                            }
                          }
                          lastMsg(created_by, element.user_id).then((res) => {
                            for (const key in users) {
                              if (created_by == users[key]) {
                                io.to(key).emit('isMessage', { messages: res });
                              }
                            }
                          });
                        });
                      });
                    }, 100);

                  });

                var receiver_id = element.user_id;
                var sender_id = element.created_by;

                const message = 'Hello! Thank you for viewing my ReChat NodeJS + Socket.io Messaging Platform as part of my portfolio. ';
                const file_upload = '';

                var insertQuery = "INSERT INTO messages(message, sender_id, receiver_id, file_upload) VALUES('" + message + "', '" + sender_id + "', '" + receiver_id + "', '" + file_upload + "')"
                const msg = await insertSqlQuery(insertQuery)
              });
            }
            else {
              io.to(socket.id).emit("contactsError", { 'msg': 'email allredy exists' });
            }
          });
        }
        else {
          io.to(socket.id).emit("contactsError", { 'msg': 'Please use valid email' });
        }
      }
      else {
        io.to(socket.id).emit("contactsError", { 'msg': 'Email not matched' });
      }
    });
  });

  // Contact List search
  socket.on('searchContactValue', ({ searchVal, userId }) => {
    searchContactData(searchVal, userId).then((contacts) => {
      io.to(socket.id).emit('contactsLists', {
        contacts: contacts
      });
    });
  });

  // User Id Wise Contact Get
  socket.on("userContact", function ({ userId }) { });

  // Delete Contact
  socket.on('contact_delete', ({ contact_id, receiverId, userId }) => {
    contactDelete(receiverId, userId).then((message) => { });
    allMessageDelete(receiverId, userId).then((message) => { });
    allSenderMessageDelete(receiverId).then((message) => { });
    for (const key in users) {
      if (receiverId == users[key]) {
        io.to(key).emit("contact_delete", ({ contact_id, receiverId, userId }))
      }
    }
  });

  // All Message Delete
  socket.on('all_Message_delete', ({ receiverId, userId }) => {
    allMessageDelete(receiverId, userId).then((message) => { });
    for (const key in users) {
      if (receiverId == users[key]) {
        io.to(key).emit("all_Message_delete", ({ receiverId, userId }))
      }
    }
  });

  /**
   * Single Chat
   */
  // Single Message Search
  socket.on('messageSearchValue', ({ searchVal, userId, receiverId }) => {
    messageSearchData(searchVal, userId, receiverId).then((message) => {
      io.to(socket.id).emit('userMessage', {
        users: message
      });
    });
  });

  // Message Create
  socket.on("chat message", async function ({ message, sender_id, receiver_id, file_upload }) {
    var insertQuery = "INSERT INTO messages(message, sender_id, receiver_id, file_upload) VALUES('" + message + "', '" + sender_id + "', '" + receiver_id + "', '" + file_upload + "')"
    const single_message = await insertSqlQuery(insertQuery)
    let id = single_message.insertId;
    var selectQuery = "Select createdAt from messages where id =" + id + ""
    const groupMsg = await getQueryResult(selectQuery)
    var createdAt = formatDate(new Date(groupMsg.createdAt));

    receiverData(sender_id).then((receiverData) => {
      const receiverName = receiverData.name;
      const receiverImage = receiverData.image;
      let myid;
      for (const key in users) {
        if (receiver_id == users[key]) {
          myid = sender_id;
          io.to(key).emit("chat message", ({ id, message, sender_id, receiver_id, file_upload, createdAt, receiverName, receiverImage, myid }));
        }
        if (sender_id == users[key]) {
          myid = receiver_id;
          io.to(key).emit("chat message", ({ id, message, sender_id, receiver_id, file_upload, createdAt, receiverName, receiverImage, myid }));
        }
      }
    });

    var updateQuery = "UPDATE contacts SET last_msg_date='" + createdAt + "' where user_id =" + sender_id + " "
    updateSqlQuery(updateQuery)
    var updateQuery = "UPDATE contacts SET last_msg_date='" + createdAt + "' where user_id =" + receiver_id + " "
    updateSqlQuery(updateQuery)

    receiverMessage(receiver_id).then((message) => {
      io.to(socket.id).emit('receiverMessageInfo', { users: message });
    });

  });

  // Message Update
  socket.on("message_update", ({ messageId, message, receiverId, userId }) => {
    messageUpdate(messageId, message).then((message) => {
    });
    for (const key in users) {
      if (receiverId == users[key]) {
        io.to(key).emit("message_update", ({ messageId, message, receiverId, userId }))
      }
    }

    EditlastMsg(userId, receiverId).then((res) => {
      io.to(socket.id).emit('isMessage', { messages: res });
      for (const key in users) {
        if (receiverId == users[key]) {
          io.to(key).emit('isMessage', { messages: res });
        }
      }
    });

  });

  // Receiver id wise data get
  socket.on("receiverId", function ({ receiver_id }) {
    receiverData(receiver_id).then((message) => {
      io.emit('receiver_data', {
        users: message
      });
    });
  });

  // Contact id wise User get
  socket.on("contactByUser", function ({ id, userId }) {
    contactListByUserId(id, userId).then((contacts) => {
      io.to(socket.id).emit('contactInfo', {
        contacts: contacts
      });
    });
  });

  // User Id Wise contact Get
  socket.on('userData', ({ userId }) => {
    userJoin(userId).then((res) => {
      io.to(socket.id).emit('roomUsers', {
        users: res
      });
    });

    contactList(userId).then((contacts) => {
      io.to(socket.id).emit('contactsLists', {
        contacts: contacts
      });
      if (contacts != null) {
        contacts.forEach(element => {
          lastMsg(userId, element.user_id).then((res) => {
            io.to(socket.id).emit('isMessage', {
              messages: res
            });
          });
        });
      }
    });
  });

  // contact list to topbar
  socket.on("chat_online", function ({ id }) {
    var online = 0;
    for (const key in users) {
      if (id == users[key]) {
        online = 1;
      }
    }
    io.to(socket.id).emit("onlineUser", ({ online }));
  });

  // contact wise sender and receiver message
  socket.on('userClick', async ({ id, userId, receiverId, startm }) => {
    // let cnt = await Msg.find({ $or: [{ sender_id: id }, { receiver_id: id }] }).count();
    var selectQuery = "Select count(*) from messages where (sender_id =" + id + " or receiver_id =" + id + ") "
    let cnt = await getQueryResult(selectQuery)
    if (startm == 0) {
      userMessage(id, userId, receiverId, startm, cnt).then((message) => {
        io.to(socket.id).emit('userMessage', {
          msgno: cnt,
          users: message
        });
      });

      var unread = 1;
      updateUnreadMsg(id, unread).then((message) => {
      });

      receiverMessage(id).then((message) => {
        io.to(socket.id).emit('receiverMessageInfo', {
          users: message
        });
      });
    } else {
      userMessage(id, userId, receiverId, startm, cnt).then((message) => {
        io.to(socket.id).emit('chat-pg', {
          users: message
        });
      });
    }
  });

  //-------------------- Unread Msg Update -----------------------//
  socket.on('unreadMsgUpdate', async ({ receiver_Id, unread }) => {
    updateUnreadMsg(receiver_Id, unread).then((message) => { });
  })

  // Single Message Typing Set
  socket.on("typing", function (data) {
    for (const key in users) {
      if (data.receiverId == users[key]) {
        io.to(key).emit("typing", data);
      }
    }

    groupById(data.receiverId).then((group) => {
      if (group != null) {
        [group].forEach(gu => {
          for (const key in users) {
            if (gu.contact_id == users[key]) {
              if (key != socket.id) { io.to(key).emit("typing", data); }
            }
          }
        });
      }
    });
  });

  // Group Typing Set
  socket.on("group_typing", function (data) {
    for (const key in users) {
      if (data.receiverId == users[key]) {
        io.to(key).emit("group_typing", data);
      }
    }
    groupById(data.receiverId).then((group) => {
      [group].forEach(gu => {
        for (const key in users) {
          if (gu.contact_id == users[key]) {
            if (key != socket.id) { io.to(key).emit("group_typing", data); }
          }
        }
      });
    });
  });

  // Single Message Delete
  socket.on('message_delete', ({ message_id, receiverId, userId }) => {
    messageDelete(message_id).then((message) => { });
    for (const key in users) {
      if (receiverId == users[key]) {
        io.to(key).emit("message_delete", ({ message_id, receiverId, userId }))
      }
    }
    contactList(userId).then((contacts) => {
      io.to(socket.id).emit('contactsLists', {
        contacts: contacts
      });
      [contacts].forEach(element => {
        lastMsg(userId, receiverId).then((res) => {
          io.to(socket.id).emit('isMessage', { messages: res });
          for (const key in users) {
            if (receiverId == users[key]) {
              io.to(key).emit('isMessage', { messages: res });
            }
          }
        });
      });
    });
  });

  /**
   * Group Message
   */
  // Group Search
  socket.on('searchGroupValue', ({ searchVal, userId }) => {
    searchGroupData(searchVal, userId).then((contacts) => {
      io.to(socket.id).emit('groupLists', {
        groups: contacts
      });
    });
  });

  // Single Group Message Search
  socket.on('groupSearchValue', ({ searchVal, receiverId }) => {
    groupSearchData(searchVal, receiverId).then((message) => {
      io.to(socket.id).emit('groupMessage', {
        groups: message
      });
    });
  });

  // Group Create
  socket.on("createGroups", async function ({ name, description, contact_list, userId }) {
    var insertQuery = "INSERT INTO groups(name, description, userId) VALUES('" + name + "', '" + description + "', '" + userId + "')"
    const groups = await insertSqlQuery(insertQuery)

    let grp_id = groups.insertId;
    contact_list.forEach(con => {
      for (const key in users) {
        if (con == users[key]) {
          io.to(key).emit("group-add", ({ grp_id, name, description, userId, contact_list }));
        }
      }
    });
    io.to(socket.id).emit("group-add", ({ grp_id, name, description, userId, contact_list }));
    var group_id = groups.insertId;
    contact_list.forEach(contact_id => {
      var insertQuery = "INSERT INTO group_users(contact_id, group_id) VALUES('" + contact_id + "', '" + group_id + "')"
      const groupUsers = insertSqlQuery(insertQuery)
    });
    var contact_id = userId;
    var is_admin = 1;
    var insertQuery = "INSERT INTO group_users(contact_id, group_id, is_admin) VALUES('" + contact_id + "', '" + group_id + "','" + is_admin + "')"
    const groupUsers1 = await insertSqlQuery(insertQuery)
  });

  // Group Message Create
  socket.on("group message", async function ({ message, sender_id, group_id, file_upload }) {
    var insertQuery = "INSERT INTO group_messages(message, sender_id, group_id, file_upload) VALUES('" + message + "', '" + sender_id + "','" + group_id + "','" + file_upload + "')"
    const groupMessage = await insertSqlQuery(insertQuery)
    var id = groupMessage.insertId
    var selectQuery = "Select createdAt from group_messages where id =" + id + ""
    const groupMsg = getQueryResult(selectQuery)
      .then(() => {
        createdAt = groupMsg.createdAt;
        receiverData(sender_id).then((receiverData) => {
          const receiverName = receiverData.name;
          const receiverImage = receiverData.image;
          groupById(group_id).then((group) => {
            group.forEach(gu => {
              for (const key in users) {
                if (gu.contact_id == users[key]) {
                  io.to(key).emit("group message", ({ id, message, sender_id, group_id, receiverName, receiverImage, file_upload, createdAt }))
                }
              }
            });
          });
        });
      });

    unreadGroupUser(group_id).then((receiverData) => {
      var info = [];
      for (i = 0; i < receiverData.length; i++) {
        if (receiverData[i]['contact_id'] != sender_id) {
          info[i] = receiverData[i]
        }
      }
      info.forEach(receiver => {
        var unread = receiver.unread + 1;
        updateUnreadGroupUser(receiver.group_id, receiver.contact_id, unread).then((receiverData) => {
        });
      });
    });

    groupsMessage(group_id).then((message) => {
      io.to(socket.id).emit('groupMessage', {
        groups: message
      });
    });
  });

  //-------------------- Unread Group Msg Update -----------------------//
  socket.on('unreadGroupMsgUpdate', async ({ groupId, userId, unread }) => {
    updateUnreadGroupMessage(groupId, userId, unread).then((message) => { });
  })

  // Contact add in group
  socket.on("addGroupContacts", function ({ contact_list, groupId, userId }) {
    contact_list.forEach(contact_id => {
      var group_id = groupId;
      var insertQuery = "INSERT INTO group_users(contact_id, group_id) VALUES('" + contact_id + "', '" + group_id + "')"
      const groupUsers = insertSqlQuery(insertQuery)
        .then(() => {
          groupById(group_id).then((group) => {
            groupData(group_id).then((groups) => {
              for (const key in users) {
                if (contact_id == users[key]) {
                  io.to(key).emit("addGroup", ({ groups }));
                }
              }
            });

            group.forEach(gu => {
              for (const key in users) {
                if (gu.contact_id == users[key]) {
                  groupContactsList(group_id, userId).then((groupes) => {
                    io.to(key).emit("groupDetail", ({ groupUsers: groupes, groupId }));
                  });
                }
              }
            });
          });
        });
    });
  });

  // group message Update
  socket.on("groupMessage_update", ({ messageId, message, groupId }) => {
    groupMessageUpdate(messageId, message).then((message) => { });
    groupById(groupId).then((group) => {
      group.forEach(gu => {
        for (const key in users) {
          if (gu.contact_id == users[key]) {
            io.to(key).emit("groupMessage_update", ({ messageId, message, groupId }));
          }
        }
      });
    });
  });

  // Get Contact List
  socket.on('contactIdByUser', (userId) => {
    contactListByUser(userId).then((contacts) => {
      io.to(socket.id).emit('groupLists', {
        groups: contacts
      });
    });
  });

  // Group Data Append Topbar
  socket.on('contactsDetail', (groupsId, userId) => {
    groupData(groupsId).then((group) => {
      io.to(socket.id).emit('groupInfo', { group: group });
    });

    let i = 0;
    groupContactsList(groupsId, userId).then((group) => {
      io.to(socket.id).emit('groupDetail', {
        groupUsers: group, groupId: groupsId
      });
      var unread = 0;
      updateUnreadGroupMessage(groupsId, userId, unread).then((group_message) => { });
    });

    groupById(groupsId).then((group) => {
      var online = [];
      [group].forEach(gu => {
        for (const key in users) {
          if (gu.contact_id == users[key]) {
            online[i] = gu.contact_id;
            i++;
          }
        }
      });
      io.to(socket.id).emit("onlineContact", ({ online }));
    });
  });

  // Contact Message Get
  socket.on('groupClick', async ({ groupId, userId, startm }) => {

    // Group Info get
    groupById(groupId).then((group) => {
      [group].forEach(gu => {
        for (const key in users) {
          if (gu.user_id == users[key]) {
            groupContactsList(groupId, userId).then((groups) => {
              io.to(socket.id).emit("groupDetail", ({ groupUsers: groups, groupId: groupId }));
            });
          }
        }
      });
    });

    if (startm == 0) {
      // let cnt = await groupMsg.find({ group_id: groupId }).count();
      var selectQuery = "Select count(*) from group_messages where group_id =" + groupId + " "
      let cnt = await getQueryResult(selectQuery)
      groupsMessage(groupId, startm).then((message) => {
        io.to(socket.id).emit('groupMessage', {
          groups: message,
          msgno: cnt
        });
      });
    }
    else {
      groupsMessage(groupId, startm).then((message) => {
        io.to(socket.id).emit('gchat-pg', {
          groups: message,
        });
      });
    }
  });

  // Online User Get
  socket.on("online_user", function (data) {
    groupById(data.groupId).then((group) => {
      [group].forEach(gu => {
        for (const key in users) {
          if (gu.contact_id == users[key]) {
            io.to(key).emit("online_user", data);
          }
        }
      });
    });
  });

  // Group Message Delete
  socket.on('group_msg_delete', ({ message_id, groupId }) => {
    groupFileDelete(message_id).then((message) => { });
    groupById(groupId).then((group) => {
      [group].forEach(gu => {
        for (const key in users) {
          if (gu.contact_id == users[key]) {
            io.to(key).emit("group_msg_delete", ({ message_id, groupId }));
          }
        }
      });
    });
    groupsMessage(groupId).then((message) => {
      io.to(socket.id).emit('groupMessage', {
        groups: message
      });
    });
  });

  // Delete Group
  socket.on('group_delete', ({ id, userId }) => {
    groupDelete(id).then((message) => { });
    groupMemberDelete(id).then((message) => { });
    groupMsgDelete(id).then((message) => { });
    // groupById(id).then((group) => {
    //   group.forEach(gu => {
    //     for (const key in users) {
    //       if (gu.contact_id == users[key]) {
    //         io.to(key).emit("group_delete", ({ id }));
    //       }
    //     }
    //   });
    // });
    contactListByUser(userId).then((contacts) => {
      io.to(socket.id).emit('groupLists', {
        groups: contacts
      });
      io.to(socket.id).emit("group_delete", ({ id }));
    });
  });

  // Delete Group Member
  socket.on('group_delete_member', ({ id, group_id }) => {
    groupDeleteMember(id, group_id).then((message) => { });
    groupById(group_id).then((group) => {
      group.forEach(gu => {
        for (const key in users) {
          if (gu.contact_id == users[key]) {
            io.to(key).emit("group_delete_member", ({ id, group_id }));
          }
        }
      });
    });
  });

  // Group User Delete
  socket.on('deleteGroupUser', ({ id, group_id }) => {
    groupById(group_id).then((group) => {
      group.forEach(gu => {
        for (const key in users) {
          if (gu.contact_id == users[key]) {
            io.to(key).emit("deleteGroupUser", ({ id, group_id }));
          }
        }
      });
    });
    deleteGroupUser(id, group_id).then((groupUser) => { });
  });

  // All Group Message Delete
  socket.on('all_Group_Message_delete', ({ receiverId }) => {
    allGroupMessageDelete(receiverId).then((message) => { });
    groupById(receiverId).then((group) => {
      var unread = 0;
      updateAllUnreadGroupMessage(receiverId, unread).then((group_message) => { });
      group.forEach(gu => {
        for (const key in users) {
          if (gu.contact_id == users[key]) {
            io.to(key).emit("all_Group_Message_delete", ({ receiverId }));
          }
        }
      });
    });
  });

  // Group Sender Message Delete
  socket.on('single_Group_Message_delete', ({ receiverId, userId }) => {
    groupSenderMessage(receiverId, userId).then((groupSenderMsg) => {
      groupById(receiverId).then((group) => {
        group.forEach(gu => {
          for (const key in users) {
            if (gu.contact_id == users[key]) {
              io.to(key).emit('groupSenderMessage', {
                groupMsgs: groupSenderMsg
              });
            }
          }
        });
      });
    });
    singleGroupMessageDelete(receiverId, userId).then((message) => { });
  });

  /**
   * Setting
   */
  // Current User data
  socket.on("currentUser", function ({ userId }) {
    currentUser(userId).then((userInfo) => {
      io.to(socket.id).emit("currentUser", ({ userInfo }));
    });
  });

  // current user name edit
  socket.on("updateUserName", function ({ userId, name }) {
    userNameUpdate(userId, name).then((userInfo) => {
      io.emit("updateUserName", ({ userInfo }));
    });
  });

  // receiver name edit
  socket.on("updateReceiverName", function ({ userId, receiverId, name }) {
    receiverNameUpdate(userId, receiverId, name).then((userInfo) => { });
  });

  // Group name edit
  socket.on("updateGroupName", function ({ groupId, name }) {
    groupNameUpdate(groupId, name).then((userInfo) => {
      groupById(groupId).then((group) => {
        group.forEach(gu => {
          for (const key in users) {
            if (gu.contact_id == users[key]) {
              io.to(key).emit('updateGroupName', { groupId, name });
            }
          }
        });
      });
    });
  });

  // notification security
  socket.on("userNotification", ({ user_id, notification }) => {
    notificationUpdate(user_id, notification).then((message) => {
    });
  });

  // notification muted security
  socket.on("userMutedNotification", ({ user_id, is_muted }) => {
    notificationMutedUpdate(user_id, is_muted).then((message) => { });
  });

  // Messag Image Upload
  app.post('/fileUploads', (req, res) => {
    if (req.files) {
      const targetFile = req.files.file;
      let uploadDir = path.join(__dirname, '/public/assets/images/image', req.body.fname);
      targetFile.mv(uploadDir, (err) => {
        if (err)
          return res.status(500).send(err);
        res.send('File uploaded!');
      });
    }
  });

  app.post('/filedelete', (req, res) => {
    if (req.body.fn) {
      fs.unlinkSync(path.join(__dirname, '/public/assets/images/image', req.body.fn));
    }
  });

  // Profile Upload
  app.post('/profileUpdate', (req, res) => {
    if (req.files) {
      const targetFile = req.files.file;
      profileUpdate(req.body.user_id, targetFile.name).then((message) => { });
      const userid = req.body.user_id;
      const image = targetFile.name;
      io.emit("message_update1", ({ userid, image }));
      let uploadDir = path.join(__dirname, '/public/assets/images/users', targetFile.name);
      targetFile.mv(uploadDir, (err) => {
        if (err)
          return res.status(500).send(err);
        res.send('File uploaded!');
      });
    }
  });

  // User Joined
  socket.on('new-user-joined', (userId, username) => {
    users[socket.id] = userId;
    socket.broadcast.emit('user-connected', userId, username);
    io.emit('user-list', users);
  });

  // User Disconnect
  socket.on("disconnect", () => {
    socket.broadcast.emit('user-disconnected', user = users[socket.id]);
    io.emit("user-list", users[socket.id]);
    userLeave({ id: users[socket.id] })
    delete users[socket.id];
  });

  app.all('*', (req, res, next) => {
    res.status(404).render('404');
  });

  // below two function are used for date formet change (UTC to Local at the time of one to one msg send)
  function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
  }
  function formatDate(date) {
    return (
      [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
      ].join('-') +
      ' ' +
      [
        padTo2Digits(date.getHours()),
        padTo2Digits(date.getMinutes()),
        padTo2Digits(date.getSeconds()),
      ].join(':')
    );
  }

});

