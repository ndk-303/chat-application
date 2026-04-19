import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

import UserModel from './models/User';
import FriendshipModel from './models/Friendship';
import FriendRequestModel from './models/FriendRequest';
import ConversationModel from './models/Conversation';
import MessageModel from './models/Message';

const log = (msg: string) => console.log(`[Seeder] ${msg}`);

async function connectDB() {
  const uri = process.env.MONGO_URI ?? '';
  if (!uri) throw new Error('MONGO_URI is not set');
  await mongoose.connect(uri, { autoIndex: true });
  log('Connected to MongoDB');
}

// ─── Seed Data Definitions ───────────────────────────────────────────────────
const SEED_USERS = [
  {
    email: 'alice@test.com',
    password: 'Test@1234',
    displayName: 'Alice Nguyen',
    bio: 'Xin chào! Tôi là Alice',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=alice',
    isVerified: true,
    isActive: true,
  },
  {
    email: 'bob@test.com',
    password: 'Test@1234',
    displayName: 'Bob Tran',
    bio: 'Hello everyone! I am Bob',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=bob',
    isVerified: true,
    isActive: true,
  },
  {
    email: 'charlie@test.com',
    password: 'Test@1234',
    displayName: 'Charlie Le',
    bio: 'Coding is my passion',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=charlie',
    isVerified: true,
    isActive: true,
  },
  {
    email: 'diana@test.com',
    password: 'Test@1234',
    displayName: 'Diana Pham',
    bio: 'Photography & Travel',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=diana',
    isVerified: true,
    isActive: true,
  },
  {
    email: 'ethan@test.com',
    password: 'Test@1234',
    displayName: 'Ethan Hoang',
    bio: 'Music lover',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ethan',
    isVerified: true,
    isActive: true,
  },
];

// ─── Main Seed Function ───────────────────────────────────────────────────────
async function seed() {
  // ── 1. Check idempotency ──────────────────────────────────────────────────
  const existingCount = await UserModel.countDocuments();
  if (existingCount >= 5) {
    log(`Data already exists (${existingCount} users found). Skipping seed.`);
    return;
  }
  log('No existing data found. Starting seed...');

  // ── 2. Create Users ───────────────────────────────────────────────────────
  const SALT_ROUNDS = 10;
  const createdUsers: (typeof UserModel.prototype)[] = [];

  for (const userData of SEED_USERS) {
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    const user = await UserModel.create({
      email: userData.email,
      password: hashedPassword,
      displayName: userData.displayName,
      bio: userData.bio,
      avatar: userData.avatar,
      isVerified: userData.isVerified,
      isActive: userData.isActive,
      status: 'online',
    });
    createdUsers.push(user);
    log(`Created user: ${userData.displayName} (${userData.email})`);
  }

  const [alice, bob, charlie, diana, ethan] = createdUsers;

  // ── 3. Create FriendRequests (accepted) + Friendships ─────────────────────
  // Định nghĩa các cặp bạn bè
  const friendPairs: [typeof alice, typeof alice][] = [
    [alice, bob],
    [alice, charlie],
    [alice, diana],
    [bob, charlie],
    [bob, ethan],
    [charlie, diana],
    [diana, ethan],
  ];

  for (const [u1, u2] of friendPairs) {
    // FriendRequest (accepted)
    await FriendRequestModel.create({
      senderId: u1._id,
      receiverId: u2._id,
      status: 'accepted',
    });

    // Friendship (đảm bảo user1Id < user2Id để không trùng lặp unique index)
    const [uid1, uid2] = [u1._id.toString(), u2._id.toString()].sort();
    await FriendshipModel.create({
      user1Id: new mongoose.Types.ObjectId(uid1),
      user2Id: new mongoose.Types.ObjectId(uid2),
    });

    log(`Friendship: ${(u1 as any).displayName} ↔ ${(u2 as any).displayName}`);
  }

  // ── 4. Create Private Conversations ──────────────────────────────────────
  // Alice ↔ Bob
  const convAliceBob = await ConversationModel.create({
    type: 'private',
    participants: [alice._id, bob._id],
    lastMessageAt: new Date(),
  });

  // Bob ↔ Charlie
  const convBobCharlie = await ConversationModel.create({
    type: 'private',
    participants: [bob._id, charlie._id],
    lastMessageAt: new Date(Date.now() - 60 * 60 * 1000), // 1h ago
  });

  // Charlie ↔ Diana
  const convCharlieDiana = await ConversationModel.create({
    type: 'private',
    participants: [charlie._id, diana._id],
    lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
  });

  log('Created 3 private conversations');

  // ── 5. Create Group Conversation ──────────────────────────────────────────
  const convGroup = await ConversationModel.create({
    type: 'group',
    participants: [alice._id, bob._id, charlie._id, diana._id, ethan._id],
    name: 'Chat App Team',
    adminId: alice._id,
    lastMessageAt: new Date(Date.now() - 30 * 60 * 1000), // 30min ago
  });

  log('Created 1 group conversation');

  // ── 6. Create Messages ────────────────────────────────────────────────────
  const now = Date.now();
  const min = 60 * 1000;

  // Alice ↔ Bob messages
  const aliceBobMessages = [
    { senderId: alice._id, content: 'Hey Bob! Bạn khỏe không?', offsetMs: 60 * min },
    { senderId: bob._id, content: 'Mình khỏe! Cảm ơn Alice. Còn bạn?', offsetMs: 58 * min },
    { senderId: alice._id, content: 'Mình cũng ổn. Hôm nay bạn có rảnh không?', offsetMs: 55 * min },
    { senderId: bob._id, content: 'Có, buổi chiều mình free. Có gì không?', offsetMs: 53 * min },
    { senderId: alice._id, content: 'Bạn muốn cùng review code project không?', offsetMs: 50 * min },
    { senderId: bob._id, content: 'Chắc chắn rồi! Code gì vậy?', offsetMs: 48 * min },
    { senderId: alice._id, content: 'Cái chat app mình đang làm đó. Cần review phần socket handler.', offsetMs: 45 * min },
    { senderId: bob._id, content: 'OK! Mình sẽ xem qua nhé. Gửi link repo đi.', offsetMs: 43 * min },
    { senderId: alice._id, content: 'https://github.com/example/chat-app', offsetMs: 40 * min },
    { senderId: bob._id, content: 'Nhận rồi! Mình check ngay', offsetMs: 38 * min },
  ];

  const createdAliceBobMsgs = [];
  for (const msg of aliceBobMessages) {
    const created = await MessageModel.create({
      conversationId: convAliceBob._id,
      senderId: msg.senderId,
      content: msg.content,
      type: 'text',
      status: 'seen',
      createdAt: new Date(now - msg.offsetMs),
      updatedAt: new Date(now - msg.offsetMs),
    });
    createdAliceBobMsgs.push(created);
  }

  // Bob ↔ Charlie messages
  const bobCharlieMessages = [
    { senderId: bob._id, content: 'Charlie ơi! Bạn đã xem tài liệu Docker chưa?', offsetMs: 90 * min },
    { senderId: charlie._id, content: 'Rồi! Docker Compose rất tiện lợi nhỉ.', offsetMs: 87 * min },
    { senderId: bob._id, content: 'Đúng rồi. Mình đang setup seeding data cho project.', offsetMs: 84 * min },
    { senderId: charlie._id, content: 'Cool! Dùng service riêng hay init script?', offsetMs: 82 * min },
    { senderId: bob._id, content: 'Service riêng, dùng ts-node cho tiện.', offsetMs: 80 * min },
    { senderId: charlie._id, content: 'Hay đó! Share config cho mình với nhé.', offsetMs: 78 * min },
  ];

  const createdBobCharlieMsgs = [];
  for (const msg of bobCharlieMessages) {
    const created = await MessageModel.create({
      conversationId: convBobCharlie._id,
      senderId: msg.senderId,
      content: msg.content,
      type: 'text',
      status: 'seen',
      createdAt: new Date(now - msg.offsetMs),
      updatedAt: new Date(now - msg.offsetMs),
    });
    createdBobCharlieMsgs.push(created);
  }

  // Charlie ↔ Diana messages
  const charlieDianaMessages = [
    { senderId: diana._id, content: 'Charlie! Tôi vừa chụp được bức ảnh đẹp lắm', offsetMs: 120 * min },
    { senderId: charlie._id, content: 'Ôi thật à? Ở đâu vậy?', offsetMs: 118 * min },
    { senderId: diana._id, content: 'Hồ Tây buổi sáng sớm. Ánh nắng tuyệt vời!', offsetMs: 115 * min },
    { senderId: charlie._id, content: 'Wow! Bạn có thể chia sẻ không?', offsetMs: 113 * min },
    { senderId: diana._id, content: 'Để mình chỉnh sửa xong mình gửi nhé', offsetMs: 110 * min },
  ];

  const createdCharlieDianaMsgs = [];
  for (const msg of charlieDianaMessages) {
    const created = await MessageModel.create({
      conversationId: convCharlieDiana._id,
      senderId: msg.senderId,
      content: msg.content,
      type: 'text',
      status: 'seen',
      createdAt: new Date(now - msg.offsetMs),
      updatedAt: new Date(now - msg.offsetMs),
    });
    createdCharlieDianaMsgs.push(created);
  }

  // Group messages
  const groupMessages = [
    { senderId: alice._id, content: 'Chào mọi người! Đây là group chat của team mình', offsetMs: 180 * min },
    { senderId: bob._id, content: 'Xin chào Alice và mọi người!', offsetMs: 175 * min },
    { senderId: charlie._id, content: 'Hello team! Vui được tham gia nhóm này.', offsetMs: 170 * min },
    { senderId: diana._id, content: 'Hi all! Trông forward to working with everyone', offsetMs: 165 * min },
    { senderId: ethan._id, content: 'Hey hey! Mình là Ethan. Sẵn sàng làm việc cùng nhau!', offsetMs: 160 * min },
    { senderId: alice._id, content: 'Tuyệt vời! Mình sẽ pin các thông tin quan trọng ở đây nhé.', offsetMs: 155 * min },
    { senderId: bob._id, content: 'Nghe hay đó Alice! Mình suggest dùng thread cho từng task riêng.', offsetMs: 150 * min },
    { senderId: charlie._id, content: '+1! À thứ 6 mình có meeting lúc 3pm nhé mọi người.', offsetMs: 145 * min },
    { senderId: diana._id, content: 'OK! Mình đã note lại rồi', offsetMs: 140 * min },
    { senderId: ethan._id, content: 'Confirmed! Mình sẽ chuẩn bị demo nhỏ.', offsetMs: 135 * min },
    { senderId: alice._id, content: 'Perfect! Hẹn gặp mọi người thứ 6 nhé', offsetMs: 30 * min },
  ];

  const createdGroupMsgs = [];
  for (const msg of groupMessages) {
    const created = await MessageModel.create({
      conversationId: convGroup._id,
      senderId: msg.senderId,
      content: msg.content,
      type: 'text',
      status: 'delivered',
      createdAt: new Date(now - msg.offsetMs),
      updatedAt: new Date(now - msg.offsetMs),
    });
    createdGroupMsgs.push(created);
  }

  log(`Created ${aliceBobMessages.length + bobCharlieMessages.length + charlieDianaMessages.length + groupMessages.length} messages`);

  // ── 7. Update lastMessageId for conversations ─────────────────────────────
  const lastAliceBob = createdAliceBobMsgs[createdAliceBobMsgs.length - 1];
  const lastBobCharlie = createdBobCharlieMsgs[createdBobCharlieMsgs.length - 1];
  const lastCharlieDiana = createdCharlieDianaMsgs[createdCharlieDianaMsgs.length - 1];
  const lastGroup = createdGroupMsgs[createdGroupMsgs.length - 1];

  await ConversationModel.findByIdAndUpdate(convAliceBob._id, {
    lastMessageId: lastAliceBob._id,
    lastMessageAt: lastAliceBob.createdAt,
  });
  await ConversationModel.findByIdAndUpdate(convBobCharlie._id, {
    lastMessageId: lastBobCharlie._id,
    lastMessageAt: lastBobCharlie.createdAt,
  });
  await ConversationModel.findByIdAndUpdate(convCharlieDiana._id, {
    lastMessageId: lastCharlieDiana._id,
    lastMessageAt: lastCharlieDiana.createdAt,
  });
  await ConversationModel.findByIdAndUpdate(convGroup._id, {
    lastMessageId: lastGroup._id,
    lastMessageAt: lastGroup.createdAt,
  });

  log('Updated lastMessageId for all conversations');
  log('Seed completed successfully!');
  log('');
  log('=== Seed Accounts ===');
  log('Email              | Password   | Name');
  log('-------------------|------------|-------------');
  for (const u of SEED_USERS) {
    log(`${u.email.padEnd(18)} | ${u.password.padEnd(10)} | ${u.displayName}`);
  }
  log('=====================');
}

// ─── Entry Point ──────────────────────────────────────────────────────────────
(async () => {
  try {
    await connectDB();
    await seed();
  } catch (err) {
    console.error('[Seeder] Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log('Disconnected from MongoDB');
    process.exit(0);
  }
})();
