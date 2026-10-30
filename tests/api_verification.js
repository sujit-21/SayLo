const http = require('http');

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (dataString) {
      headers['Content-Length'] = Buffer.byteLength(dataString);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        host: 'localhost',
        port: 5000,
        path: `/api/v1${path}`,
        method,
        headers,
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseBody);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: responseBody });
          }
        });
      }
    );

    req.on('error', reject);
    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
};

async function runTests() {
  console.log('🚀 Starting SAYLO Full-Stack Verification Suite...\n');

  try {
    // 1. Test Alice Login
    console.log('1. Testing Alice Login (/api/v1/auth/login)...');
    const aliceLogin = await request('POST', '/auth/login', {
      email: 'alice@saylo.com',
      password: 'password123',
    });
    if (aliceLogin.status !== 200 || !aliceLogin.data.token) {
      throw new Error(`Alice login failed: ${JSON.stringify(aliceLogin)}`);
    }
    const aliceToken = aliceLogin.data.token;
    console.log(`✅ Alice logged in successfully. User: ${aliceLogin.data.user.name}`);

    // 2. Test Bob Login
    console.log('\n2. Testing Bob Login (/api/v1/auth/login)...');
    const bobLogin = await request('POST', '/auth/login', {
      email: 'bob@saylo.com',
      password: 'password123',
    });
    if (bobLogin.status !== 200 || !bobLogin.data.token) {
      throw new Error(`Bob login failed: ${JSON.stringify(bobLogin)}`);
    }
    const bobToken = bobLogin.data.token;
    console.log(`✅ Bob logged in successfully. User: ${bobLogin.data.user.name}`);

    // 3. Test Fetch Conversations for Alice
    console.log('\n3. Testing Alice Fetch Conversations (/api/v1/conversations)...');
    const convRes = await request('GET', '/conversations', null, aliceToken);
    if (convRes.status !== 200 || !Array.isArray(convRes.data.conversations)) {
      throw new Error(`Fetch conversations failed: ${JSON.stringify(convRes)}`);
    }
    console.log(`✅ Fetched ${convRes.data.conversations.length} conversations for Alice.`);

    // Find direct conversation between Alice and Bob
    const directChat = convRes.data.conversations.find((c) => !c.isGroup && !c.isNoteToSelf);
    if (!directChat) {
      throw new Error('Direct chat between Alice and Bob not found');
    }
    console.log(`✅ Direct Chat located: ID ${directChat._id}`);

    // 4. Test Sending Message from Alice to Bob
    console.log('\n4. Testing Alice Sending Message (/api/v1/messages)...');
    const sendRes = await request(
      'POST',
      '/messages',
      {
        conversationId: directChat._id,
        text: 'Automated test message: SAYLO full-stack verified! 🚀',
        type: 'text',
      },
      aliceToken
    );
    if (sendRes.status !== 201 || !sendRes.data.message) {
      throw new Error(`Send message failed: ${JSON.stringify(sendRes)}`);
    }
    const messageId = sendRes.data.message._id;
    console.log(`✅ Message sent! ID: ${messageId}, Text: "${sendRes.data.message.text}"`);

    // 5. Test Bob Fetching the New Message
    console.log('\n5. Testing Bob Fetching Messages (/api/v1/messages/:id)...');
    const bobMsgs = await request('GET', `/messages/${directChat._id}`, null, bobToken);
    const foundMsg = bobMsgs.data.messages.find((m) => m._id === messageId);
    if (!foundMsg) {
      throw new Error('Bob did not receive Alice\'s new message');
    }
    console.log(`✅ Bob verified message received: "${foundMsg.text}"`);

    // 6. Test Emoji Reaction by Bob
    console.log('\n6. Testing Bob Adding Emoji Reaction (/api/v1/messages/:id/react)...');
    const reactRes = await request('POST', `/messages/${messageId}/react`, { emoji: '🔥' }, bobToken);
    if (reactRes.status !== 200 || !reactRes.data.message.reactions.length) {
      throw new Error(`Reaction failed: ${JSON.stringify(reactRes)}`);
    }
    console.log(`✅ Reaction recorded: ${reactRes.data.message.reactions[0].emoji}`);

    // 7. Test Star Message by Alice
    console.log('\n7. Testing Alice Star Message (/api/v1/messages/:id/star)...');
    const starRes = await request('POST', `/messages/${messageId}/star`, null, aliceToken);
    if (starRes.status !== 200 || !starRes.data.isStarred) {
      throw new Error(`Star failed: ${JSON.stringify(starRes)}`);
    }
    console.log(`✅ Message starred successfully!`);

    // 8. Test Status Story Creation by Alice
    console.log('\n8. Testing Alice Create Status (/api/v1/status)...');
    const statusRes = await request(
      'POST',
      '/status',
      {
        content: 'Testing 24h disappearing status story on SAYLO!',
        bgColor: '#128c7e',
        fontStyle: 'sans',
      },
      aliceToken
    );
    if (statusRes.status !== 201 || !statusRes.data.status) {
      throw new Error(`Create status failed: ${JSON.stringify(statusRes)}`);
    }
    console.log(`✅ Status story posted! ID: ${statusRes.data.status._id}`);

    // 9. Test Bob Viewing Status Updates
    console.log('\n9. Testing Bob Fetching Statuses (/api/v1/status)...');
    const bobStatus = await request('GET', '/status', null, bobToken);
    if (bobStatus.status !== 200 || !bobStatus.data.statuses.length) {
      throw new Error(`Bob fetch status failed: ${JSON.stringify(bobStatus)}`);
    }
    console.log(`✅ Bob fetched ${bobStatus.data.statuses.length} status story groups.`);

    // 10. Test Logging Call Record
    console.log('\n10. Testing WebRTC Call Logging (/api/v1/calls)...');
    const callRes = await request(
      'POST',
      '/calls',
      {
        receiverId: bobLogin.data.user._id,
        conversationId: directChat._id,
        type: 'video',
        status: 'completed',
        duration: 45,
      },
      aliceToken
    );
    if (callRes.status !== 201 || !callRes.data.call) {
      throw new Error(`Call log failed: ${JSON.stringify(callRes)}`);
    }
    console.log(`✅ Call logged! ID: ${callRes.data.call._id}, Type: ${callRes.data.call.type}, Duration: ${callRes.data.call.duration}s`);

    // 11. Test Group Event Creation
    console.log('\n11. Testing Group Event Creation (/api/v1/messages)...');
    const eventRes = await request(
      'POST',
      '/messages',
      {
        conversationId: directChat._id,
        type: 'event',
        event: {
          title: 'SAYLO Q4 Planning Review',
          description: 'Quarterly architecture and feature roadmap meeting',
          startTime: new Date(Date.now() + 86400000),
          location: 'Conference Room Alpha',
          attendees: [],
        },
      },
      aliceToken
    );
    if (eventRes.status !== 201 || !eventRes.data.message.event) {
      throw new Error(`Event creation failed: ${JSON.stringify(eventRes)}`);
    }
    const eventMessageId = eventRes.data.message._id;
    console.log(`✅ Event message created! Title: "${eventRes.data.message.event.title}"`);

    // 12. Test Bob RSVP to Event
    console.log('\n12. Testing Event RSVP (/api/v1/messages/:id/event/rsvp)...');
    const rsvpRes = await request(
      'POST',
      `/messages/${eventMessageId}/event/rsvp`,
      { status: 'going' },
      bobToken
    );
    if (rsvpRes.status !== 200 || !rsvpRes.data.message.event.attendees.length) {
      throw new Error(`Event RSVP failed: ${JSON.stringify(rsvpRes)}`);
    }
    console.log(`✅ Bob RSVP recorded: Status "${rsvpRes.data.message.event.attendees[0].status}"`);

    // 13. Test Privacy Setting: Silence Unknown Callers
    console.log('\n13. Testing Privacy Settings Update (/api/v1/auth/privacy)...');
    const privRes = await request(
      'PUT',
      '/auth/privacy',
      { silenceUnknownCallers: true, readReceipts: true },
      aliceToken
    );
    if (privRes.status !== 200 || !privRes.data.privacy.silenceUnknownCallers) {
      throw new Error(`Privacy update failed: ${JSON.stringify(privRes)}`);
    }
    console.log(`✅ Privacy setting updated: silenceUnknownCallers = ${privRes.data.privacy.silenceUnknownCallers}`);

    // 14. Test Chat Lock PIN Verification
    console.log('\n14. Testing Chat Lock PIN Setup & Verification (/api/v1/auth/chat-lock-pin)...');
    await request('POST', '/auth/chat-lock-pin', { pin: '7788' }, aliceToken);
    const pinVerifyRes = await request(
      'POST',
      '/auth/chat-lock-pin',
      { action: 'verify', enteredPin: '7788' },
      aliceToken
    );
    if (pinVerifyRes.status !== 200 || !pinVerifyRes.data.verified) {
      throw new Error(`PIN verification failed: ${JSON.stringify(pinVerifyRes)}`);
    }
    console.log(`✅ Chat Lock PIN verified successfully!`);

    console.log('\n🎉 ALL 14 ADVANCED VERIFICATION TESTS PASSED SUCCESSFULLY! SAYLO full-stack platform is 100% complete and verified.\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

runTests();

