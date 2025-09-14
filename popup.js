firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const POTION_SVG_ICON = `<svg class="potion-icon" version="1.1" viewBox="0 0 512 512" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path style="fill:#B4D8F1;" d="M298.667,176.044V0h-85.333v176.044c-73.61,18.945-128,85.766-128,165.289 C85.333,435.59,161.744,512,256,512s170.667-76.41,170.667-170.667C426.667,261.81,372.277,194.99,298.667,176.044z"/><path style="fill:#98C8ED;" d="M298.667,176.044V0H256v512c94.256,0,170.667-76.41,170.667-170.667 C426.667,261.81,372.277,194.99,298.667,176.044z"/><path style="fill:#E592BF;" d="M85.333,341.333C85.333,435.59,161.744,512,256,512s170.667-76.41,170.667-170.667H85.333z"/><rect x="213.333" style="fill:#A58868;" width="85.333" height="85.333"/><rect x="256" style="fill:#947859;" width="42.667" height="85.333"/><path style="fill:#E176AF;" d="M256,341.333V512c94.256,0,170.667-76.41,170.667-170.667H256z"/></g></svg>`;

async function displaySocialData(userId) {
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    console.error("User document not found!");
    return;
  }
  const userData = userDoc.data();

  const friendsList = document.getElementById("friends-list");
  const mailboxList = document.getElementById("mailbox-list-container");
  const giftFriendsList = document.getElementById("gift-friends-list");

  friendsList.innerHTML = "";
  mailboxList.innerHTML = "";
  giftFriendsList.innerHTML = "";

  if (
    userData.incomingFriendRequests &&
    userData.incomingFriendRequests.length > 0
  ) {
    for (const requesterId of userData.incomingFriendRequests) {
      const requesterDoc = await db.collection("users").doc(requesterId).get();
      const requesterData = requesterDoc.data();

      const mailboxListItem = document.createElement("div");
      mailboxListItem.className = "mailbox-item";
      mailboxListItem.innerHTML = `
        <div class="request-text-container">
          <span class="request-text">Friend Request:</span>
          <span class="request-text">${requesterData.displayName}</span>
        </div>
        <div class="request-actions">
          <button class="action-btn productive" title="Accept Request" data-id="${requesterId}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>
          </button>
          <button class="action-btn unproductive" title="Decline Request" data-id="${requesterId}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
          </button>
        </div>
      `;
      mailboxList.appendChild(mailboxListItem);
    }
  } else {
    mailboxList.innerHTML =
      "<span class='empty-mailbox-message'>Your mailbox is empty.</span>";
  }

  const giftsRef = db.collection("gifts");
  const giftsQuery = giftsRef
    .where("toId", "==", userId)
    .where("status", "==", "unclaimed");
  const giftsSnapshot = await giftsQuery.get();

  if (!giftsSnapshot.empty) {
    if (mailboxList.querySelector(".empty-mailbox-message")) {
      mailboxList.innerHTML = "";
    }

    giftsSnapshot.forEach((giftDoc) => {
      const giftData = giftDoc.data();
      const giftItem = document.createElement("div");
      giftItem.className = "mailbox-item";

      if (giftData.giftType === "gold") {
        giftItem.innerHTML = `
          <div class="gift-text-container">
            <span class="gift-subtitle">Thanks for sharing</span>
            <span class="gift-subtitle">Tab Garden!</span>
          </div>
          <button class="claim-gift-btn gift-reward-button" data-gift-id="${giftDoc.id}" data-gift-type="gold" data-amount="${giftData.amount}">
            <span>100</span>
            <svg class="gold-icon" version="1.1" viewBox="0 0 512 512" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path d="M256,512C114.842,512,0,397.158,0,256S114.842,0,256,0s256,114.842,256,256S397.158,512,256,512z" style="fill:#FFDA44;"/><path d="M256,0L256,0v5.565V512l0,0c141.158,0,256-114.842,256-256S397.158,0,256,0z" style="fill:#FFA733;"/><path d="M256,439.652c-101.266,0-183.652-82.391-183.652-183.652S154.733,72.348,256,72.348   S439.652,154.739,439.652,256S357.266,439.652,256,439.652z" style="fill:#EE8700;"/><path d="M439.652,256c0-101.261-82.386-183.652-183.652-183.652v367.304 C357.266,439.652,439.652,357.261,439.652,256z" style="fill:#CC7400;"/><path d="M263.805,241.239c-17.517-9.261-35.631-18.826-35.631-29.761c0-15.348,12.484-27.826,27.826-27.826   s27.826,12.478,27.826,27.826c0,9.217,7.473,16.696,16.696,16.696s16.696-7.479,16.696-16.696c0-27.956-18.867-51.548-44.522-58.842   v-7.94c0-9.217-7.473-16.696-16.696-16.696s-16.696,7.479-16.696,16.696v7.94c-25.655,7.294-44.522,30.886-44.522,58.842   c0,31.044,29.619,46.707,53.413,59.283c17.517,9.261,35.631,18.826,35.631,29.761c0,15.348-12.484,27.826-27.826,27.826   s-27.826-12.478-27.826-27.826c0-9.217-7.473-16.696-16.696-16.696s-16.696,7.479-16.696,16.696   c0,27.956,18.867,51.548,44.522,58.842v7.94c0,9.217,7.473,16.696,16.696,16.696s16.696-7.479,16.696,16.696v-7.94   c25.655-7.294,44.522-30.886,44.522-58.842C317.217,269.478,287.598,253.815,263.805,241.239z" style="fill:#FFDA44;"/><g><path d="M272.696,367.304v-7.94c25.655-7.294,44.522-30.886,44.522-58.842    c0-31.044-29.619-46.707-53.413-59.283c-2.616-1.384-5.226-2.777-7.805-4.176v37.875c14.699,7.976,27.826,16.283,27.826,25.584    c0,15.348-12.484,27.826-27.826,27.826V384C265.223,384,272.696,376.521,272.696,367.304z" style="fill:#FFA733;"/><path d="M283.826,211.478c0,9.217,7.473,16.696,16.696,16.696s16.696-7.479,16.696-16.696    c0-27.956-18.867-51.548-44.522-58.842v-7.94c0-9.217-7.473-16.696-16.696-16.696v55.652    C271.342,183.652,283.826,196.13,283.826,211.478z" style="fill:#FFA733;"/></g></g></svg>
          </button>
        `;
      } else {
        const plantData = PLANT_DATABASE[giftData.plantType];
        giftItem.innerHTML = `
          <div class="gift-text-container">
            <span class="plant-gift-text">${giftData.fromName} gifted you a ${plantData.name}!</span>
          </div>
          <button class="claim-gift-btn plant-claim-button" data-gift-id="${giftDoc.id}" data-plant-type="${giftData.plantType}">Claim!</button>
        `;
      }
      mailboxList.appendChild(giftItem);
    });
  }

  const invalidFriendIds = [];

  const currentUserItem = document.createElement("li");
  currentUserItem.className = "friend-item current-user-item";
  currentUserItem.innerHTML = `
    <span class="friend-name">${userData.displayName} (You)</span>
    <div class="friend-actions">
      <span class="friend-score">Productivity: ${userData.productivityScore}%</span>
      <div class="remove-btn-container"></div>
    </div>
  `;
  friendsList.appendChild(currentUserItem);

  if (userData.friends && userData.friends.length > 0) {
    for (const friendId of userData.friends) {
      const friendDoc = await db.collection("users").doc(friendId).get();

      if (friendDoc.exists) {
        const friendData = friendDoc.data();
        const listItem = document.createElement("li");
        listItem.className = "friend-item";
        listItem.innerHTML = `
          <span class="friend-name">${friendData.displayName}</span>
          <div class="friend-actions">
            <span class="friend-score">Productivity: ${friendData.productivityScore}%</span>
            <div class="remove-btn-container">
                <button class="remove-friend-btn" data-id="${friendId}" title="Remove Friend">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
                </button>
            </div>
          </div>
        `;
        friendsList.appendChild(listItem);

        const giftFriendButton = document.createElement("button");
        giftFriendButton.className = "select-friend-btn";
        giftFriendButton.textContent = friendData.displayName;
        giftFriendButton.dataset.id = friendId;
        giftFriendsList.appendChild(giftFriendButton);
      } else {
        console.warn(`Friend ID ${friendId} not found. Queuing for removal.`);
        invalidFriendIds.push(friendId);
      }
    }

    if (invalidFriendIds.length > 0) {
      await userRef.update({
        friends: firebase.firestore.FieldValue.arrayRemove(...invalidFriendIds),
      });
      console.log("Cleaned up invalid friend IDs from the user's friend list.");
    }
  }

  if (
    friendsList.children.length <= 1 &&
    (!userData.friends || userData.friends.length === 0)
  ) {
    friendsList.innerHTML =
      "<li class='empty-message-li'>You have no friends yet. Add one below!</li>";
  }

  if (giftFriendsList.children.length === 0) {
    giftFriendsList.innerHTML =
      "<span class='empty-message'>Add friends to send gifts.</span>";
  }
}

function updateGiftDropdown() {
  chrome.storage.local.get(["plantInventory"], (data) => {
    const { plantInventory = {} } = data;
    const giftablePlantsList = document.getElementById("giftable-plants-list");
    giftablePlantsList.innerHTML = "";

    const giftablePlants = Object.values(plantInventory).filter(
      (p) => p.currentGrowth === 100
    );

    if (giftablePlants.length === 0) {
      giftablePlantsList.innerHTML =
        "<span class='empty-gift-message'>No plants are ready to gift.</span>";
      return;
    }

    giftablePlants.forEach((plant) => {
      const plantData = PLANT_DATABASE[plant.type];
      const button = document.createElement("button");
      button.className = "gift-item-btn";
      button.textContent = `🌸 ${plantData.name}`;

      button.addEventListener("click", () => {
        window.plantToGift = plant;
        console.log(`1. CLICKED PLANT: plantToGift is now set to`, plantToGift);
        document
          .getElementById("gift-plant-selection")
          .classList.remove("active");
        document
          .getElementById("gift-recipient-selection")
          .classList.add("active");
      });
      giftablePlantsList.appendChild(button);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll("nav .radio");
  const pages = document.querySelectorAll(".page");
  const plantNameDisplay = document.getElementById("plant-name-display");
  const plantAnimationBox = document.getElementById("plant-animation-box");
  const plantStats = document.getElementById("plant-stats");
  const noPlantView = document.getElementById("no-plant-view");
  const seedDropdown = document.getElementById("seed-dropdown");
  const plantBtn = document.getElementById("action-plant");
  const fertilizerDropdown = document.getElementById("fertilizer-dropdown");
  const transferBtn = document.getElementById("action-transfer");
  const fertilizerBtn = document.getElementById("action-fertilize");
  const reviveBtn = document.getElementById("action-revive");
  const reviveDropdown = document.getElementById("revive-dropdown");
  const sellPlantBtn = document.getElementById("sell-plant-btn");
  const MAX_GARDEN_SIZE = 8;
  let isPurchasing = false;
  let plantToGift = null;

  const signupForm = document.getElementById("signup-form");
  const loginForm = document.getElementById("login-form");
  const resendBtn = document.getElementById("resend-verification-btn");
  const forgotPasswordLink = document.getElementById("forgot-password-link");

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();

      const emailInput = document.querySelector(
        "#login-form input[name='email']"
      );
      const email = emailInput.value.trim();

      if (!email) {
        alert(
          "Please enter your email address above, then click 'Forgot Password?' again."
        );
        return;
      }

      auth
        .sendPasswordResetEmail(email)
        .then(() => {
          alert(
            "Password reset email sent! Please check your inbox (and spam folder)."
          );
        })
        .catch((error) => {
          console.error("Password Reset Error:", error);
          alert(error.message);
        });
    });
  }

  if (resendBtn) {
    resendBtn.addEventListener("click", () => {
      const user = auth.currentUser;
      if (user) {
        user
          .sendEmailVerification()
          .then(() => {
            alert(
              "Another verification email has been sent. Please check your spam inbox."
            );
          })
          .catch((error) => {
            alert(error.message);
          });
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = signupForm.email.value;
      const password = signupForm.password.value;
      const name = signupForm.name.value;

      if (!name.trim()) {
        alert("Please enter your name.");
        return;
      }

      auth
        .createUserWithEmailAndPassword(email, password)
        .then(async (cred) => {
          const user = cred.user;
          await user.getIdToken(true);
          await db.collection("users").doc(user.uid).set({
            displayName: name,
            email: user.email.toLowerCase(),
            productivityScore: 0,
            friends: [],
            incomingFriendRequests: [],
            outgoingFriendRequests: [],
          });

          try {
            await processSignUpReward(user.email.toLowerCase(), user.uid);
          } catch (e) {
            console.warn("Invite reward skipped:", e);
          }

          chrome.runtime.sendMessage({ action: "userLoggedIn", user });
          user.sendEmailVerification();
          alert("Account created! Verification email sent.");
        })
        .then(() => {
          console.log("User profile created in Firestore!");
        })
        .catch((error) => {
          alert(error.message);
          console.error("Signup Error:", error);
        });
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = loginForm.email.value;
      const password = loginForm.password.value;

      auth
        .signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          console.log("User logged in:", user.email);
          chrome.runtime.sendMessage({ action: "userLoggedIn", user: user });
        })
        .catch((error) => {
          alert(error.message);
          console.error("Login Error:", error);
        });
    });
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      auth
        .signOut()
        .then(() => {
          console.log("User signed out.");
          chrome.runtime.sendMessage({ action: "userLoggedOut" });
        })
        .catch((error) => {
          console.error("Sign out error", error);
        });
    });
  }

  const addFriendBtn = document.getElementById("add-friend-btn");

  if (addFriendBtn) {
    addFriendBtn.addEventListener("click", async () => {
      const emailToSearch = document
        .getElementById("add-friend-email")
        .value.trim();
      const currentUser = auth.currentUser;

      if (!emailToSearch || !currentUser) {
        alert("Please enter an email.");
        return;
      }
      if (emailToSearch === currentUser.email) {
        alert("You can't add yourself as a friend.");
        return;
      }

      const usersRef = db.collection("users");
      const query = usersRef.where("email", "==", emailToSearch).limit(1);
      const snapshot = await query.get();

      if (snapshot.empty) {
        alert("User not found.");
        return;
      }

      const targetUserId = snapshot.docs[0].id;
      const currentUserRef = db.collection("users").doc(currentUser.uid);
      const targetUserRef = db.collection("users").doc(targetUserId);

      const batch = db.batch();

      batch.update(currentUserRef, {
        outgoingFriendRequests:
          firebase.firestore.FieldValue.arrayUnion(targetUserId),
      });
      batch.update(targetUserRef, {
        incomingFriendRequests: firebase.firestore.FieldValue.arrayUnion(
          currentUser.uid
        ),
      });

      await batch.commit();
      alert("Friend request sent!");
      document.getElementById("add-friend-email").value = "";
    });
  }

  const mailboxListContainer = document.getElementById(
    "mailbox-list-container"
  );

  if (mailboxListContainer) {
    mailboxListContainer.addEventListener("click", async (e) => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const actionButton = e.target.closest(".action-btn");

      if (actionButton && actionButton.dataset.id) {
        const requesterId = actionButton.dataset.id;
        const currentUserRef = db.collection("users").doc(currentUser.uid);
        const requesterRef = db.collection("users").doc(requesterId);
        const batch = db.batch();

        if (actionButton.classList.contains("productive")) {
          batch.update(currentUserRef, {
            friends: firebase.firestore.FieldValue.arrayUnion(requesterId),
            incomingFriendRequests:
              firebase.firestore.FieldValue.arrayRemove(requesterId),
          });
          batch.update(requesterRef, {
            friends: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
            outgoingFriendRequests: firebase.firestore.FieldValue.arrayRemove(
              currentUser.uid
            ),
          });
        } else if (actionButton.classList.contains("unproductive")) {
          batch.update(currentUserRef, {
            incomingFriendRequests:
              firebase.firestore.FieldValue.arrayRemove(requesterId),
          });
          batch.update(requesterRef, {
            outgoingFriendRequests: firebase.firestore.FieldValue.arrayRemove(
              currentUser.uid
            ),
          });
        }

        await batch.commit();
        displaySocialData(currentUser.uid);
      } else if (e.target.classList.contains("claim-gift-btn")) {
        const giftId = e.target.dataset.giftId;
        const giftRef = db.collection("gifts").doc(giftId);

        if (e.target.dataset.giftType === "gold") {
          const amount = parseInt(e.target.dataset.amount, 10);

          const data = await chrome.storage.local.get("playerGold");
          const newGoldValue = (data.playerGold || 0) + amount;

          await chrome.storage.local.set({ playerGold: newGoldValue });

          await giftRef.update({ status: "claimed" });

          alert(`You claimed ${amount} gold!`);
        } else {
          const plantType = e.target.dataset.plantType;
          if (!plantType) return;

          const { plantInventory = {} } = await chrome.storage.local.get(
            "plantInventory"
          );
          const instanceId = `${plantType}_${Date.now()}`;
          plantInventory[instanceId] = {
            instanceId: instanceId,
            type: plantType,
            dayPlanted: new Date().toISOString().slice(0, 10),
            currentHealth: 100,
            currentGrowth: 100,
          };

          await chrome.storage.local.set({ plantInventory });
          await giftRef.update({ status: "claimed" });

          alert(`You received a ${PLANT_DATABASE[plantType].name}!`);
        }
        displaySocialData(currentUser.uid);
      }
    });
  }

  const friendsList = document.getElementById("friends-list");

  if (friendsList) {
    friendsList.addEventListener("click", async (e) => {
      const removeBtn = e.target.closest(".remove-friend-btn");

      if (removeBtn) {
        const currentUser = auth.currentUser;
        const friendIdToRemove = removeBtn.dataset.id;

        if (!currentUser || !friendIdToRemove) return;

        if (confirm("Are you sure you want to remove this friend?")) {
          const currentUserRef = db.collection("users").doc(currentUser.uid);
          const friendRef = db.collection("users").doc(friendIdToRemove);
          const batch = db.batch();

          batch.update(currentUserRef, {
            friends:
              firebase.firestore.FieldValue.arrayRemove(friendIdToRemove),
          });

          batch.update(friendRef, {
            friends: firebase.firestore.FieldValue.arrayRemove(currentUser.uid),
          });

          await batch.commit();
          displaySocialData(currentUser.uid);
        }
      }
    });
  }

  const socialMoreBtn = document.getElementById("action-social-more");

  if (socialMoreBtn) {
    socialMoreBtn.addEventListener("click", () => {
      const friendsList = document.getElementById("friends-list");
      friendsList.classList.toggle("show-remove");
    });
  }

  const giftBtn = document.getElementById("action-gift");
  const inviteBtn = document.getElementById("action-invite");
  const mailboxBtn = document.getElementById("action-mailbox");

  const setupDropdownHover = (button) => {
    if (!button) return;
    const dropdown = button.querySelector(".dropdown-content");
    if (dropdown) {
      button.addEventListener("mouseenter", () =>
        dropdown.classList.add("open")
      );
      button.addEventListener("mouseleave", () =>
        dropdown.classList.remove("open")
      );
    }
  };

  if (giftBtn) {
    const giftDropdown = document.getElementById("gift-dropdown");
    const plantSelectionView = document.getElementById("gift-plant-selection");
    const recipientSelectionView = document.getElementById(
      "gift-recipient-selection"
    );
    const giftFriendsList = document.getElementById("gift-friends-list");

    giftBtn.addEventListener("mouseenter", () => {
      plantToGift = null;
      plantSelectionView.classList.add("active");
      recipientSelectionView.classList.remove("active");
      updateGiftDropdown();
      giftDropdown.classList.add("open");
    });

    giftBtn.addEventListener("mouseleave", () => {
      giftDropdown.classList.remove("open");
    });

    giftFriendsList.addEventListener("click", async (e) => {
      if (e.target.classList.contains("select-friend-btn")) {
        const currentUser = auth.currentUser;
        const recipientId = e.target.dataset.id;

        if (!window.plantToGift || !currentUser || !recipientId) {
          console.error(
            "Missing data for gifting. plantToGift:",
            window.plantToGift
          );
          return;
        }

        const currentUserDoc = await db
          .collection("users")
          .doc(currentUser.uid)
          .get();
        if (!currentUserDoc.exists) {
          console.error("Could not find the sender's user profile.");
          return;
        }
        const senderName = currentUserDoc.data().displayName;

        await db.collection("gifts").add({
          fromId: currentUser.uid,
          fromName: senderName,
          toId: recipientId,
          plantType: window.plantToGift.type,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          status: "unclaimed",
        });

        const { plantInventory } = await chrome.storage.local.get(
          "plantInventory"
        );
        delete plantInventory[window.plantToGift.instanceId];
        await chrome.storage.local.set({ plantInventory });

        alert(
          `You've sent a ${
            PLANT_DATABASE[window.plantToGift.type].name
          } to your friend!`
        );

        giftDropdown.classList.remove("open");
      }
    });
  }

  async function sendInvitation(inviterId, invitedEmail) {
    const usersRef = db.collection("users");
    const userQuery = usersRef.where("email", "==", invitedEmail).limit(1);
    const userSnapshot = await userQuery.get();

    if (!userSnapshot.empty) {
      alert("This person already has a Tab Garden account!");
      return false;
    }

    const invitesRef = db.collection("invites");
    const inviteQuery = invitesRef.where("email", "==", invitedEmail).limit(1);
    const inviteSnapshot = await inviteQuery.get();

    if (!inviteSnapshot.empty) {
      alert("An invitation has already been sent to this email address.");
      return false;
    }

    await invitesRef.add({
      from: inviterId,
      email: invitedEmail,
      status: "pending",
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    return true;
  }

  async function processSignUpReward(newUserEmail, newUserId) {
    const invitesRef = db.collection("invites");
    const inviteQuery = invitesRef
      .where("email", "==", newUserEmail)
      .where("status", "==", "pending")
      .limit(1);

    const querySnapshot = await inviteQuery.get();

    if (!querySnapshot.empty) {
      const inviteDoc = querySnapshot.docs[0];
      const inviterId = inviteDoc.data().from;

      await db.collection("gifts").add({
        toId: inviterId,
        fromName: "Tab Garden Rewards",
        giftType: "gold",
        amount: 100,
        status: "unclaimed",
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });

      await inviteDoc.ref.update({
        status: "completed",
        completedBy: newUserId,
      });

      console.log(`A 100 gold reward gift has been sent to user ${inviterId}.`);
    }
  }

  if (inviteBtn) {
    const sendInviteBtn = document.getElementById("send-invite-btn");
    const initialView = document.getElementById("invite-initial-view");
    const shareView = document.getElementById("invite-share-view");
    const emailInput = document.getElementById("invite-email-input");

    sendInviteBtn.addEventListener("click", async () => {
      const emailToInvite = emailInput.value.trim();
      const currentUser = auth.currentUser;

      if (!emailToInvite || !currentUser) {
        alert("Please enter a valid email address.");
        return;
      }

      const success = await sendInvitation(currentUser.uid, emailToInvite);

      if (success) {
        emailInput.value = "";
        initialView.classList.remove("active");
        shareView.classList.add("active");
      }
    });
  }

  setupDropdownHover(inviteBtn);
  setupDropdownHover(mailboxBtn);

  auth.onAuthStateChanged((user) => {
    const loggedInView = document.getElementById("social-page-logged-in");
    const loggedOutView = document.getElementById("social-page-logged-out");
    const verifyEmailBanner = document.getElementById("verify-email-banner");

    if (user) {
      loggedInView.style.display = "block";
      loggedOutView.style.display = "none";

      if (user.emailVerified) {
        verifyEmailBanner.style.display = "none";
        displaySocialData(user.uid);
      } else {
        verifyEmailBanner.style.display = "block";
        displaySocialData(user.uid);
      }
    } else {
      loggedInView.style.display = "none";
      loggedOutView.style.display = "block";
      verifyEmailBanner.style.display = "none";
    }
  });

  function timeAgo(isoString) {
    const date = new Date(isoString);
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  }

  function displayActivityLog() {
    const dropdown = document.getElementById("activity-log-dropdown");
    chrome.storage.local.get("activityLog", (data) => {
      const { activityLog = [] } = data;
      dropdown.innerHTML = "";

      if (activityLog.length === 0) {
        dropdown.innerHTML = "<span>No recent activity.</span>";
        return;
      }

      const ul = document.createElement("ul");
      activityLog.forEach((entry) => {
        const li = document.createElement("li");
        const messageSpan = document.createElement("span");
        const timeSpan = document.createElement("span");

        messageSpan.textContent = entry.message;
        timeSpan.textContent = timeAgo(entry.timestamp);
        timeSpan.className = "log-time";

        li.appendChild(messageSpan);
        li.appendChild(timeSpan);
        ul.appendChild(li);
      });
      dropdown.appendChild(ul);
    });
  }

  function formatTime(seconds) {
    if (seconds < 60) return `${seconds} sec`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  }

  function setStaticFrame(plantSprite, animData, frame) {
    plantSprite.style.backgroundImage = `url(${animData.sprite})`;
    plantSprite.style.backgroundSize = `${animData.totalFrames * 100}% 100%`;
    const position = `${((frame - 1) / (animData.totalFrames - 1)) * 100}%`;
    plantSprite.style.backgroundPositionX = position;
  }

  /**
   * Determines the correct growth stage object based on the plant's growth percentage.
   * @param {object} plantData - The plant's data from PLANT_DATABASE.
   * @param {number} growth - The current growth percentage.
   * @returns {object} The stage object { threshold, image }.
   */
  function getStageForGrowth(plantData, growth) {
    let currentStage = plantData.growthStages[0];
    for (const stage of plantData.growthStages) {
      if (growth >= stage.threshold) {
        currentStage = stage;
      } else {
        break;
      }
    }
    return currentStage;
  }

  function displayCurrentPlant() {
    const healthBarFill = document.getElementById("health-bar-fill");
    const growthBarFill = document.getElementById("growth-bar-fill");
    const plantSprite = document.getElementById("plant-sprite");

    chrome.storage.local.get(["currentPlantId", "plantInventory"], (data) => {
      const { currentPlantId, plantInventory } = data;

      if (currentPlantId && plantInventory && plantInventory[currentPlantId]) {
        const plant = plantInventory[currentPlantId];
        const plantData = PLANT_DATABASE[plant.type];

        plantNameDisplay.textContent = plantData.name;
        document.getElementById("plant-id-data").textContent = plant.instanceId;
        document.getElementById("plant-name-data").textContent = plantData.name;
        document.getElementById("plant-desc-data").textContent =
          plantData.description;
        document.getElementById("plant-date-data").textContent =
          plant.dayPlanted;
        document.getElementById(
          "plant-hp-data"
        ).textContent = `${plant.currentHealth}/100`;
        document.getElementById(
          "plant-growth-data"
        ).textContent = `${plant.currentGrowth}%`;

        const targetStage = getStageForGrowth(plantData, plant.currentGrowth);
        const displayedThreshold = parseInt(
          plantSprite.dataset.threshold || -1
        );
        const animData = plantData.animationData;

        if (displayedThreshold !== targetStage.threshold) {
          const transition = plantData.transitions[targetStage.threshold];

          if (transition && animData) {
            const steps = transition.endFrame - transition.startFrame;
            const startPos = `${
              ((transition.startFrame - 1) / (animData.totalFrames - 1)) * 100
            }%`;
            const endPos = `${
              ((transition.endFrame - 1) / (animData.totalFrames - 1)) * 100
            }%`;

            plantSprite.classList.remove("is-animating");
            void plantSprite.offsetWidth;

            plantSprite.style.setProperty(
              "--sprite-width",
              `${animData.totalFrames * 100}%`
            );
            plantSprite.style.setProperty("--steps", steps);
            plantSprite.style.setProperty("--duration", transition.duration);
            plantSprite.style.setProperty("--start-pos", startPos);
            plantSprite.style.setProperty("--end-pos", endPos);

            plantSprite.style.backgroundImage = `url(${animData.sprite})`;
            plantSprite.classList.add("is-animating");

            plantSprite.addEventListener(
              "animationend",
              () => {
                plantSprite.classList.remove("is-animating");
                setStaticFrame(plantSprite, animData, targetStage.staticFrame);
              },
              { once: true }
            );
          } else if (animData) {
            setStaticFrame(plantSprite, animData, targetStage.staticFrame);
          }
          plantSprite.dataset.threshold = targetStage.threshold;
        } else if (!plantSprite.style.backgroundImage && animData) {
          setStaticFrame(plantSprite, animData, targetStage.staticFrame);
        }

        healthBarFill.style.width = `${plant.currentHealth}%`;
        growthBarFill.style.width = `${plant.currentGrowth}%`;
      } else {
        plantNameDisplay.textContent = "None";
        document.getElementById("plant-id-data").textContent = "N/A";
        document.getElementById("plant-name-data").textContent = "N/A";
        document.getElementById("plant-desc-data").textContent =
          "No plant is active.";
        document.getElementById("plant-date-data").textContent = "N/A";
        document.getElementById("plant-hp-data").textContent = "N/A";
        document.getElementById("plant-growth-data").textContent = "N/A";
        healthBarFill.style.width = "0%";
        growthBarFill.style.width = "0%";
        plantSprite.style.backgroundImage = "none";
        plantSprite.removeAttribute("data-threshold");
      }
    });
  }

  function updateSellDropdown() {
    chrome.storage.local.get(["plantInventory", "currentPlantId"], (data) => {
      const { plantInventory = {}, currentPlantId } = data;
      const sellDropdown = document.getElementById("sell-plant-dropdown");
      sellDropdown.innerHTML = "";

      const inventoryContainer = document.createElement("div");
      inventoryContainer.id = "plant-inventory-container";
      sellDropdown.appendChild(inventoryContainer);

      const title = document.createElement("h4");
      title.textContent = "Plants to Sell:";
      inventoryContainer.appendChild(title);

      const buttonListContainer = document.createElement("div");
      buttonListContainer.className = "button-list-container";
      inventoryContainer.appendChild(buttonListContainer);

      const sellablePlants = Object.values(plantInventory).filter(
        (p) => p.currentGrowth === 100 && p.instanceId !== currentPlantId
      );

      if (sellablePlants.length === 0) {
        const noItemsEl = document.createElement("span");
        noItemsEl.textContent = "No plants are ready to sell.";
        buttonListContainer.appendChild(noItemsEl);
        return;
      }

      sellablePlants.forEach((plant) => {
        const plantData = PLANT_DATABASE[plant.type];
        const button = document.createElement("button");
        button.className = "sell-item-btn";

        button.innerHTML = `🌸 ${plantData.name} for ${plantData.sellValue} <svg class="gold-icon" version="1.1" viewBox="0 0 512 512" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path d="M256,512C114.842,512,0,397.158,0,256S114.842,0,256,0s256,114.842,256,256S397.158,512,256,512z" style="fill:#FFDA44;"/><path d="M256,0L256,0v5.565V512l0,0c141.158,0,256-114.842,256-256S397.158,0,256,0z" style="fill:#FFA733;"/><path d="M256,439.652c-101.266,0-183.652-82.391-183.652-183.652S154.733,72.348,256,72.348   S439.652,154.739,439.652,256S357.266,439.652,256,439.652z" style="fill:#EE8700;"/><path d="M439.652,256c0-101.261-82.386-183.652-183.652-183.652v367.304 C357.266,439.652,439.652,357.261,439.652,256z" style="fill:#CC7400;"/><path d="M263.805,241.239c-17.517-9.261-35.631-18.826-35.631-29.761c0-15.348,12.484-27.826,27.826-27.826   s27.826,12.478,27.826,27.826c0,9.217,7.473,16.696,16.696,16.696s16.696-7.479,16.696-16.696c0-27.956-18.867-51.548-44.522-58.842   v-7.94c0-9.217-7.473-16.696-16.696-16.696s-16.696,7.479-16.696,16.696v7.94c-25.655,7.294-44.522,30.886-44.522,58.842   c0,31.044,29.619,46.707,53.413,59.283c17.517,9.261,35.631,18.826,35.631,29.761c0,15.348-12.484,27.826-27.826,27.826   s-27.826-12.478-27.826-27.826c0-9.217-7.473-16.696-16.696-16.696s-16.696,7.479-16.696,16.696   c0,27.956,18.867,51.548,44.522,58.842v7.94c0,9.217,7.473,16.696,16.696,16.696s16.696-7.479,16.696-16.696v-7.94   c25.655-7.294,44.522-30.886,44.522-58.842C317.217,269.478,287.598,253.815,263.805,241.239z" style="fill:#FFDA44;"/><g><path d="M272.696,367.304v-7.94c25.655-7.294,44.522-30.886,44.522-58.842    c0-31.044-29.619-46.707-53.413-59.283c-2.616-1.384-5.226-2.777-7.805-4.176v37.875c14.699,7.976,27.826,16.283,27.826,25.584    c0,15.348-12.484,27.826-27.826,27.826V384C265.223,384,272.696,376.521,272.696,367.304z" style="fill:#FFA733;"/><path d="M283.826,211.478c0,9.217,7.473,16.696,16.696,16.696s16.696-7.479,16.696-16.696    c0-27.956-18.867-51.548-44.522-58.842v-7.94c0-9.217-7.473-16.696-16.696-16.696v55.652    C271.342,183.652,283.826,196.13,283.826,211.478z" style="fill:#FFA733;"/></g></g></svg>`;

        button.addEventListener("click", () => sellPlant(plant.instanceId));
        buttonListContainer.appendChild(button);
      });
    });
  }

  async function sellPlant(instanceId) {
    const data = await chrome.storage.local.get([
      "plantInventory",
      "playerGold",
      "activityLog",
    ]);
    const plantToSell = data.plantInventory[instanceId];
    if (!plantToSell) return;

    const plantData = PLANT_DATABASE[plantToSell.type];
    const sellValue = plantData.sellValue;

    data.playerGold += sellValue;
    delete data.plantInventory[instanceId];

    data.activityLog.unshift({
      timestamp: new Date().toISOString(),
      message: `You sold a ${plantData.name} for ${sellValue} gold.`,
    });
    if (data.activityLog.length > 30) data.activityLog.pop();

    await chrome.storage.local.set({
      plantInventory: data.plantInventory,
      playerGold: data.playerGold,
      activityLog: data.activityLog,
    });

    alert(`You sold your ${plantData.name} for ${sellValue} gold!`);

    await renderGardenPlots();
    await updateSellDropdown();
    document.getElementById("sell-plant-dropdown").classList.remove("open");
  }

  function updatePlantDropdown() {
    chrome.storage.local.get(
      ["seedInventory", "plantInventory", "currentPlantId"],
      (data) => {
        const {
          seedInventory = [],
          plantInventory = {},
          currentPlantId,
        } = data;
        seedDropdown.innerHTML = "";

        const inventoryContainer = document.createElement("div");
        inventoryContainer.id = "plant-inventory-container";
        seedDropdown.appendChild(inventoryContainer);

        const title = document.createElement("h4");
        title.textContent = "Your Inventory";
        inventoryContainer.appendChild(title);

        const buttonListContainer = document.createElement("div");
        buttonListContainer.className = "button-list-container";
        inventoryContainer.appendChild(buttonListContainer);

        const isPlantActive = currentPlantId !== null;
        const allPlants = Object.values(plantInventory);

        if (seedInventory.length === 0 && allPlants.length === 0) {
          const noItemsEl = document.createElement("span");
          noItemsEl.textContent = "Your inventory is empty.";
          buttonListContainer.appendChild(noItemsEl);
          return;
        }

        seedInventory.forEach((seedType) => {
          const seedData = PLANT_DATABASE[seedType];
          const button = document.createElement("button");
          button.innerHTML = `🌱 ${seedData.name} (Seed)`;
          button.dataset.seedType = seedType;
          button.disabled = isPlantActive;
          if (isPlantActive) {
            button.title = "Transfer your current plant to plant a new seed.";
          }
          button.addEventListener("click", () => plantSeed(seedType));
          buttonListContainer.appendChild(button);
        });

        allPlants.forEach((plant) => {
          const plantData = PLANT_DATABASE[plant.type];
          const button = document.createElement("button");
          button.textContent = `🌸 ${plantData.name} (${plant.currentGrowth}%)`;

          if (plant.instanceId === currentPlantId) {
            button.textContent += " (Active)";
            button.disabled = true;
          } else {
            button.disabled = isPlantActive;
            if (isPlantActive) {
              button.title = "Transfer your current plant to switch.";
            }
            button.addEventListener("click", () =>
              setActivePlant(plant.instanceId)
            );
          }
          buttonListContainer.appendChild(button);
        });
      }
    );
  }

  function setActivePlant(plantInstanceId) {
    chrome.storage.local.set({ currentPlantId: plantInstanceId }, () => {
      console.log(`Switched active plant to: ${plantInstanceId}`);
      displayCurrentPlant();
      updatePlantDropdown();
      seedDropdown.classList.remove("open");
      updateFertilizerDropdown();
      updatePotionDropdown();
    });
  }

  function plantSeed(seedType) {
    chrome.storage.local.get(
      ["seedInventory", "plantInventory", "currentPlantId"],
      (data) => {
        if (data.currentPlantId) {
          alert("Please transfer your current plant to the garden first!");
          return;
        }
        const plantCount = Object.keys(data.plantInventory).length;
        if (plantCount >= MAX_GARDEN_SIZE + 1) {
          alert(
            `Your garden and active slot are full! You cannot have more than ${
              MAX_GARDEN_SIZE + 1
            } plants.`
          );
          return;
        }

        const { seedInventory, plantInventory } = data;

        const instanceId = `${seedType}_${Date.now()}`;
        const newPlant = {
          instanceId: instanceId,
          type: seedType,
          dayPlanted: new Date().toISOString().slice(0, 10),
          currentHealth: 50,
          currentGrowth: 0,
        };

        plantInventory[instanceId] = newPlant;
        const seedIndex = seedInventory.indexOf(seedType);
        if (seedIndex > -1) {
          seedInventory.splice(seedIndex, 1);
        }

        chrome.storage.local.set(
          {
            plantInventory: plantInventory,
            seedInventory: seedInventory,
            currentPlantId: instanceId,
          },
          () => {
            console.log(
              `${seedType} planted! New current plant is ${instanceId}`
            );
            displayCurrentPlant();
            updatePlantDropdown();
            seedDropdown.classList.remove("open");
            updateFertilizerDropdown();
            updatePotionDropdown();
          }
        );
      }
    );
  }

  function updateWaterLevelDisplay() {
    const waterBtn = document.getElementById("action-water");
    chrome.storage.local.get("waterCanValue", (data) => {
      const waterCanValue = data.waterCanValue || 0;
      waterBtn.title = `Water (${waterCanValue}% Full)`;
    });
  }

  function updatePotionDropdown() {
    chrome.storage.local.get(["potionInventory", "currentPlantId"], (data) => {
      const { potionInventory = {}, currentPlantId } = data;
      reviveDropdown.innerHTML = "";

      const inventoryContainer = document.createElement("div");
      inventoryContainer.id = "plant-inventory-container";
      reviveDropdown.appendChild(inventoryContainer);

      const title = document.createElement("h4");
      title.textContent = "Your Potions";
      inventoryContainer.appendChild(title);

      const buttonListContainer = document.createElement("div");
      buttonListContainer.className = "button-list-container";
      inventoryContainer.appendChild(buttonListContainer);

      const isPlantActive = currentPlantId !== null;
      const potionTypes = Object.keys(potionInventory).filter(
        (type) => potionInventory[type] > 0
      );

      if (potionTypes.length === 0) {
        const noItemsEl = document.createElement("span");
        noItemsEl.textContent = "You have no potions.";
        buttonListContainer.appendChild(noItemsEl);
        return;
      }

      potionTypes.forEach((type) => {
        const count = potionInventory[type];
        const button = document.createElement("button");
        const displayName = type
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        button.innerHTML = `${POTION_SVG_ICON} ${displayName} (x${count})`;
        button.dataset.potionType = type;
        button.disabled = !isPlantActive;
        if (!isPlantActive) {
          button.title = "A plant must be active to use a potion.";
        }

        button.addEventListener("click", () => usePotion(type));
        buttonListContainer.appendChild(button);
      });
    });
  }

  async function usePotion(potionType) {
    const data = await chrome.storage.local.get([
      "potionInventory",
      "plantInventory",
      "currentPlantId",
      "activityLog",
    ]);

    const {
      potionInventory,
      plantInventory,
      currentPlantId,
      activityLog = [],
    } = data;

    if (!currentPlantId || !plantInventory[currentPlantId]) {
      console.error("No active plant to use potion on.");
      return;
    }
    if (!potionInventory[potionType] || potionInventory[potionType] <= 0) {
      console.error("No potion of that type left.");
      return;
    }

    const plant = plantInventory[currentPlantId];
    const potionEffects = {
      "dose-of-sunshine": 10,
      "aspirin-can": 20,
      "revive-stone": 50,
    };

    const hpToAdd = potionEffects[potionType] || 0;
    const displayName = potionType
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    plant.currentHealth = Math.min(100, plant.currentHealth + hpToAdd);
    potionInventory[potionType] -= 1;

    activityLog.unshift({
      timestamp: new Date().toISOString(),
      message: `Used a ${displayName}, restoring ${hpToAdd} HP.`,
    });
    if (activityLog.length > 30) activityLog.pop();

    await chrome.storage.local.set({
      plantInventory: plantInventory,
      potionInventory: potionInventory,
      activityLog: activityLog,
    });

    console.log(`Used ${potionType}. Restored ${hpToAdd} HP.`);
    alert(`You used a ${displayName} and restored ${hpToAdd} HP!`);

    displayCurrentPlant();
    updatePotionDropdown();
    displayActivityLog();
    reviveDropdown.classList.remove("open");
  }

  function updateFertilizerDropdown() {
    chrome.storage.local.get(
      ["fertilizerInventory", "currentPlantId"],
      (data) => {
        const { fertilizerInventory = {}, currentPlantId } = data;
        fertilizerDropdown.innerHTML = "";

        const inventoryContainer = document.createElement("div");
        inventoryContainer.id = "plant-inventory-container";
        fertilizerDropdown.appendChild(inventoryContainer);

        const title = document.createElement("h4");
        title.textContent = "Your Fertilizers";
        inventoryContainer.appendChild(title);

        const buttonListContainer = document.createElement("div");
        buttonListContainer.className = "button-list-container";
        inventoryContainer.appendChild(buttonListContainer);

        const isPlantActive = currentPlantId !== null;

        const rarityOrder = ["common", "uncommon", "rare", "epic", "legendary"];

        const ownedFertilizerTypes = Object.keys(fertilizerInventory).filter(
          (type) => fertilizerInventory[type] > 0
        );

        const sortedFertilizerTypes = ownedFertilizerTypes.sort(
          (a, b) => rarityOrder.indexOf(a) - rarityOrder.indexOf(b)
        );

        if (sortedFertilizerTypes.length === 0) {
          const noItemsEl = document.createElement("span");
          noItemsEl.textContent = "You have no fertilizer.";
          buttonListContainer.appendChild(noItemsEl);
          return;
        }

        sortedFertilizerTypes.forEach((type) => {
          const count = fertilizerInventory[type];
          const button = document.createElement("button");
          const displayName = type.charAt(0).toUpperCase() + type.slice(1);
          button.textContent = `✨ ${displayName} (x${count})`;
          button.dataset.fertilizerType = type;
          button.disabled = !isPlantActive;
          if (!isPlantActive) {
            button.title = "A plant must be active to use fertilizer.";
          }

          button.addEventListener("click", () => useFertilizer(type));
          buttonListContainer.appendChild(button);
        });
      }
    );
  }

  function useFertilizer(type) {
    chrome.storage.local.get(
      ["fertilizerInventory", "plantInventory", "currentPlantId"],
      (data) => {
        const { fertilizerInventory, plantInventory, currentPlantId } = data;

        if (!currentPlantId || !plantInventory[currentPlantId]) {
          console.error("No active plant to fertilize.");
          return;
        }
        if (!fertilizerInventory[type] || fertilizerInventory[type] <= 0) {
          console.error("No fertilizer of that type left.");
          return;
        }

        const plant = plantInventory[currentPlantId];
        const plantRules = PLANT_DATABASE[plant.type].rules;

        if (plant.currentHealth < plantRules.growthThreshold) {
          console.log(
            `Plant HP (${plant.currentHealth}) is below threshold (${plantRules.growthThreshold}). Fertilizer has no effect.`
          );
          alert(
            `Your ${plant.type}'s health is too low! Water it before using fertilizer.`
          );
          return;
        }

        const baseGrowthValues = {
          common: 5,
          uncommon: 10,
          rare: 15,
          epic: 20,
          legendary: 25,
        };
        const baseGrowth = baseGrowthValues[type] || 0;
        const hpPercent = plant.currentHealth / 100;
        const growthRate = plantRules.growthRate || 1;

        const actualGrowth = Math.floor(baseGrowth * hpPercent * growthRate);

        plant.currentGrowth = Math.min(100, plant.currentGrowth + actualGrowth);
        fertilizerInventory[type] -= 1;

        chrome.storage.local.set(
          {
            plantInventory: plantInventory,
            fertilizerInventory: fertilizerInventory,
          },
          () => {
            console.log(
              `Used ${type} fertilizer. Added ${actualGrowth} growth. New total: ${plant.currentGrowth}`
            );
            displayCurrentPlant();
            updateFertilizerDropdown();
            fertilizerDropdown.classList.remove("open");
          }
        );
      }
    );
  }

  async function waterPlant() {
    const data = await chrome.storage.local.get([
      "waterCanValue",
      "plantInventory",
      "currentPlantId",
      "activityLog",
    ]);

    const {
      waterCanValue,
      plantInventory,
      currentPlantId,
      activityLog = [],
    } = data;

    if (!currentPlantId || !plantInventory[currentPlantId]) {
      alert("You must have an active plant to water!");
      return;
    }

    const plant = plantInventory[currentPlantId];
    const hpToAdd = Math.floor(waterCanValue / 10);

    if (hpToAdd <= 0) {
      alert(
        "Your water can is empty! Spend time on productive sites to fill it."
      );
      return;
    }

    plant.currentHealth = Math.min(100, plant.currentHealth + hpToAdd);

    activityLog.unshift({
      timestamp: new Date().toISOString(),
      message: `You watered your plant for ${hpToAdd} HP.`,
    });
    if (activityLog.length > 30) activityLog.pop();

    await chrome.storage.local.set({
      plantInventory: plantInventory,
      waterCanValue: 0,
      activityLog: activityLog,
    });

    console.log(
      `Watered plant for ${hpToAdd} HP. New HP: ${plant.currentHealth}. Water can reset.`
    );
    alert(`You watered your plant and restored ${hpToAdd} HP!`);

    displayCurrentPlant();
    updateWaterLevelDisplay();
    displayActivityLog();
  }

  function displayStats() {
    chrome.storage.session.get(["sessionData"], (result) => {
      const sessionData = result.sessionData || {};
      const statsContainer = document.getElementById("stats-container");
      statsContainer.innerHTML = "";
      const sortedSites = Object.entries(sessionData).sort(
        ([, a], [, b]) => b - a
      );
      if (sortedSites.length === 0) {
        statsContainer.textContent =
          "No activity tracked yet for this session.";
        document.getElementById("productivity-score-header").textContent = "0";
        document.getElementById("debug-total").textContent = "0 min";
        document.getElementById("debug-productive").textContent = "0 min";
        document.getElementById("debug-unproductive").textContent = "0 min";
        return;
      }
      for (const [hostname, time] of sortedSites) {
        const siteElement = document.createElement("div");
        siteElement.className = "site-stat";
        siteElement.textContent = `${hostname}: ${formatTime(time)}`;
        statsContainer.appendChild(siteElement);
      }
      chrome.storage.local.get(
        ["productiveSites", "unproductiveSites"],
        (storage) => {
          const productiveSites = storage.productiveSites || [];
          const unproductiveSites = storage.unproductiveSites || [];
          let totalProductiveTime = 0,
            totalUnproductiveTime = 0,
            totalSessionTime = 0;
          for (const [hostname, time] of sortedSites) {
            totalSessionTime += time;
            if (productiveSites.includes(hostname)) {
              totalProductiveTime += time;
            } else if (unproductiveSites.includes(hostname)) {
              totalUnproductiveTime += time;
            }
          }
          document.getElementById("debug-total").textContent =
            formatTime(totalSessionTime);
          document.getElementById("debug-productive").textContent =
            formatTime(totalProductiveTime);
          document.getElementById("debug-unproductive").textContent =
            formatTime(totalUnproductiveTime);
          let score = 0;
          if (totalSessionTime > 0) {
            score = (totalProductiveTime / totalSessionTime) * 100;
          }
          document.getElementById("productivity-score-header").textContent =
            score.toFixed(0);
        }
      );
    });
  }

  let currentGardenPage = 0;

  async function renderGardenPlots() {
    const mainGardenDisplay = document.getElementById("main-garden-display");
    mainGardenDisplay.innerHTML = "";

    const data = await chrome.storage.local.get([
      "plantInventory",
      "currentPlantId",
    ]);
    const { plantInventory = {}, currentPlantId } = data;

    const gardenPlants = Object.values(plantInventory).filter(
      (p) => p.instanceId !== currentPlantId
    );

    let currentPage = null;

    for (let i = 0; i < MAX_GARDEN_SIZE; i++) {
      if (i % 4 === 0) {
        currentPage = document.createElement("div");
        currentPage.className = "garden-plot-page";
        mainGardenDisplay.appendChild(currentPage);
      }

      const plotContainer = document.createElement("div");
      plotContainer.className = "garden-plant-container";

      const plantForThisPlot = gardenPlants[i];

      if (plantForThisPlot) {
        const plantData = PLANT_DATABASE[plantForThisPlot.type];
        const stage = getStageForGrowth(
          plantData,
          plantForThisPlot.currentGrowth
        );
        const animData = plantData.animationData;

        plotContainer.innerHTML = `
          <div class="plant-name">${plantData.name}</div>
          <div class="plant-image-container">
            <div class="garden-plant-sprite"></div>
          </div>
          <div class="plant-stats-display">
            <span>HP: ${Math.floor(plantForThisPlot.currentHealth)}/100</span>
            <span>Growth: ${plantForThisPlot.currentGrowth}%</span>
          </div>
        `;

        const spriteEl = plotContainer.querySelector(".garden-plant-sprite");
        if (spriteEl && animData) {
          spriteEl.style.backgroundImage = `url(${animData.sprite})`;
          spriteEl.style.backgroundSize = `${animData.totalFrames * 100}% 100%`;
          const position = `${
            ((stage.staticFrame - 1) / (animData.totalFrames - 1)) * 100
          }%`;
          spriteEl.style.backgroundPositionX = position;
        }
      } else {
        plotContainer.innerHTML = `
          <div class="plant-name">(Empty Plot)</div>
          <div class="plant-image-container"></div>
          <div class="plant-stats-display">
            <span>HP: --</span>
            <span>Growth: --</span>
          </div>
        `;
      }
      currentPage.appendChild(plotContainer);
    }
  }

  async function updateGardenPage() {
    await renderGardenPlots();
    await updateSellDropdown();
    updateGardenDisplay();
  }

  function updateGardenDisplay() {
    const mainGardenDisplay = document.getElementById("main-garden-display");
    const leftBtn = document.getElementById("garden-nav-left");
    const rightBtn = document.getElementById("garden-nav-right");

    const pages = document.querySelectorAll(".garden-plot-page");
    const pageCount = pages.length;

    mainGardenDisplay.style.transform = `translateX(-${
      currentGardenPage * 100
    }%)`;

    leftBtn.disabled = currentGardenPage === 0;
    rightBtn.disabled = currentGardenPage >= pageCount - 1;
  }

  async function displayShop() {
    await chrome.runtime.sendMessage({ action: "ensureShopIsInitialized" });
    const data = await chrome.storage.local.get([
      "playerGold",
      "dailyShopItems",
      "dailyShopSeeds",
    ]);
    const { playerGold = 0, dailyShopItems = [], dailyShopSeeds = [] } = data;
    document.getElementById("gold-display").querySelector("span").textContent =
      playerGold;
    const itemContainer = document.getElementById("item-shop-container");
    const seedContainer = document.getElementById("seed-shop-container");
    itemContainer.innerHTML = "";
    seedContainer.innerHTML = "";

    const createShopCard = (item, type, index) => {
      const card = document.createElement("div");
      card.className = "shop-item";
      card.innerHTML = `
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-price">${
          item.cost
        } <svg class="gold-icon" version="1.1" viewBox="0 0 512 512" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path d="M256,512C114.842,512,0,397.158,0,256S114.842,0,256,0s256,114.842,256,256S397.158,512,256,512z" style="fill:#FFDA44;"/><path d="M256,0L256,0v5.565V512l0,0c141.158,0,256-114.842,256-256S397.158,0,256,0z" style="fill:#FFA733;"/><path d="M256,439.652c-101.266,0-183.652-82.391-183.652-183.652S154.733,72.348,256,72.348   S439.652,154.739,439.652,256S357.266,439.652,256,439.652z" style="fill:#EE8700;"/><path d="M439.652,256c0-101.261-82.386-183.652-183.652-183.652v367.304 C357.266,439.652,439.652,357.261,439.652,256z" style="fill:#CC7400;"/><path d="M263.805,241.239c-17.517-9.261-35.631-18.826-35.631-29.761c0-15.348,12.484-27.826,27.826-27.826   s27.826,12.478,27.826,27.826c0,9.217,7.473,16.696,16.696,16.696s16.696-7.479,16.696-16.696c0-27.956-18.867-51.548-44.522-58.842   v-7.94c0-9.217-7.473-16.696-16.696-16.696s-16.696,7.479-16.696,16.696v7.94c-25.655,7.294-44.522,30.886-44.522,58.842   c0,31.044,29.619,46.707,53.413,59.283c17.517,9.261,35.631,18.826,35.631,29.761c0,15.348-12.484,27.826-27.826,27.826   s-27.826-12.478-27.826-27.826c0-9.217-7.473-16.696-16.696-16.696s-16.696,7.479-16.696,16.696   c0,27.956,18.867,51.548,44.522,58.842v7.94c0,9.217,7.473,16.696,16.696,16.696s16.696-7.479,16.696-16.696v-7.94   c25.655-7.294,44.522-30.886,44.522-58.842C317.217,269.478,287.598,253.815,263.805,241.239z" style="fill:#FFDA44;"/><g><path d="M272.696,367.304v-7.94c25.655-7.294,44.522-30.886,44.522-58.842    c0-31.044-29.619-46.707-53.413-59.283c-2.616-1.384-5.226-2.777-7.805-4.176v37.875c14.699,7.976,27.826,16.283,27.826,25.584    c0,15.348-12.484,27.826-27.826,27.826V384C265.223,384,272.696,376.521,272.696,367.304z" style="fill:#FFA733;"/><path d="M283.826,211.478c0,9.217,7.473,16.696,16.696,16.696s16.696-7.479,16.696-16.696    c0-27.956-18.867-51.548-44.522-58.842v-7.94c0-9.217-7.473-16.696-16.696-16.696v55.652    C271.342,183.652,283.826,196.13,283.826,211.478z" style="fill:#FFA733;"/></g></g></svg></div>
        <button data-id="${
          item.id
        }" data-type="${type}" data-index="${index}" ${
        item.soldOut ? "disabled" : ""
      }>
          ${item.soldOut ? "Sold Out" : "Buy"}
        </button>`;
      card
        .querySelector("button")
        .addEventListener("click", () => purchaseItem(item, type, index));
      return card;
    };

    if (dailyShopItems && dailyShopItems.length > 0) {
      dailyShopItems.forEach((item, index) =>
        itemContainer.appendChild(createShopCard(item, "item", index))
      );
    }
    if (dailyShopSeeds && dailyShopSeeds.length > 0) {
      dailyShopSeeds.forEach((seed, index) =>
        seedContainer.appendChild(createShopCard(seed, "seed", index))
      );
    }
  }

  async function purchaseItem(itemToBuy, type, index) {
    if (isPurchasing) {
      return;
    }
    isPurchasing = true;

    try {
      const data = await chrome.storage.local.get([
        "playerGold",
        "fertilizerInventory",
        "potionInventory",
        "seedInventory",
        "plantInventory",
        "dailyShopItems",
        "dailyShopSeeds",
        "activityLog",
      ]);

      if (data.playerGold < itemToBuy.cost) {
        alert("Not enough gold!");
        return;
      }

      if (type === "seed") {
        const plantCount = Object.keys(data.plantInventory).length;
        if (plantCount >= MAX_GARDEN_SIZE + 1) {
          alert("Your garden and active slot are full!");
          return;
        }
      }

      data.playerGold -= itemToBuy.cost;

      if (type === "item") {
        if (
          itemToBuy.id.includes("sunshine") ||
          itemToBuy.id.includes("aspirin") ||
          itemToBuy.id.includes("stone")
        ) {
          data.potionInventory[itemToBuy.id] =
            (data.potionInventory[itemToBuy.id] || 0) + 1;
        } else {
          data.fertilizerInventory[itemToBuy.id] =
            (data.fertilizerInventory[itemToBuy.id] || 0) + 1;
        }
      } else if (type === "seed") {
        data.seedInventory.push(itemToBuy.id);
      }

      const shopList =
        type === "item" ? data.dailyShopItems : data.dailyShopSeeds;

      const purchasedItem = shopList[index];

      if (purchasedItem && purchasedItem.id === itemToBuy.id) {
        if (purchasedItem.soldOut) {
          return;
        }
        purchasedItem.soldOut = true;
      } else {
        console.error("Shop item mismatch at index! Aborting purchase.");
        return;
      }

      data.activityLog.unshift({
        timestamp: new Date().toISOString(),
        message: `You purchased ${itemToBuy.name}.`,
      });
      if (data.activityLog.length > 30) data.activityLog.pop();

      await chrome.storage.local.set({
        playerGold: data.playerGold,
        fertilizerInventory: data.fertilizerInventory,
        potionInventory: data.potionInventory,
        seedInventory: data.seedInventory,
        dailyShopItems: data.dailyShopItems,
        dailyShopSeeds: data.dailyShopSeeds,
        activityLog: data.activityLog,
      });

      await displayShop();
    } catch (error) {
      console.error("An error occurred during purchase:", error);
    } finally {
      isPurchasing = false;
    }
  }

  // --- CATEGORIZATION PAGE LOGIC ---
  const productiveList = document.getElementById("productive-sites-list");
  const unproductiveList = document.getElementById("unproductive-sites-list");
  const uncategorizedList = document.getElementById("uncategorized-sites-list");
  const addProductiveInput = document.getElementById("add-productive-input");
  const addUnproductiveInput = document.getElementById(
    "add-unproductive-input"
  );
  const addProductiveBtn = document.getElementById("add-productive-btn");
  const addUnproductiveBtn = document.getElementById("add-unproductive-btn");

  function renderLists(productiveSites, unproductiveSites, uncategorizedSites) {
    productiveList.innerHTML = "";
    unproductiveList.innerHTML = "";
    uncategorizedList.innerHTML = "";
    productiveSites.forEach((site) => addSiteToList(site, "productive"));
    unproductiveSites.forEach((site) => addSiteToList(site, "unproductive"));
    uncategorizedSites.forEach((site) => addUncategorizedSiteToList(site));
  }

  function addSiteToList(site, type) {
    const list = type === "productive" ? productiveList : unproductiveList;
    const listItem = document.createElement("li");
    const siteButton = document.createElement("button");
    siteButton.textContent = site;
    siteButton.className = "site-remove-btn";
    siteButton.title = `Click to remove ${site}`;
    siteButton.addEventListener("click", () => removeSite(site, type));
    listItem.appendChild(siteButton);
    list.appendChild(listItem);
  }

  function addUncategorizedSiteToList(site) {
    const listItem = document.createElement("li");
    listItem.className = "uncategorized-item";
    const siteText = document.createElement("span");
    siteText.textContent = site;

    const productiveBtn = document.createElement("button");
    productiveBtn.className = "action-btn productive";
    productiveBtn.title = "Mark as Productive";
    productiveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>`;
    productiveBtn.addEventListener("click", () => addSite(site, "productive"));

    const unproductiveBtn = document.createElement("button");
    unproductiveBtn.className = "action-btn unproductive";
    unproductiveBtn.title = "Mark as Unproductive";
    unproductiveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>`;
    unproductiveBtn.addEventListener("click", () =>
      addSite(site, "unproductive")
    );

    listItem.appendChild(siteText);
    listItem.appendChild(productiveBtn);
    listItem.appendChild(unproductiveBtn);
    uncategorizedList.appendChild(listItem);
  }

  function addSite(site, type) {
    if (!site) return;
    const key = type === "productive" ? "productiveSites" : "unproductiveSites";
    chrome.storage.local.get([key], (result) => {
      const sites = result[key] || [];
      if (!sites.includes(site)) {
        sites.push(site);
        chrome.storage.local.set({ [key]: sites }, () => {
          initializeCategorizationPage();
        });
      }
    });
  }

  function removeSite(site, type) {
    const key = type === "productive" ? "productiveSites" : "unproductiveSites";
    chrome.storage.local.get([key], (result) => {
      let sites = result[key] || [];
      sites = sites.filter((s) => s !== site);
      chrome.storage.local.set({ [key]: sites }, () => {
        initializeCategorizationPage();
      });
    });
  }

  function initializeCategorizationPage() {
    chrome.storage.local.get(
      ["productiveSites", "unproductiveSites"],
      (localResult) => {
        chrome.storage.session.get(["sessionData"], (sessionResult) => {
          const productiveSites = localResult.productiveSites || [];
          const unproductiveSites = localResult.unproductiveSites || [];
          const sessionData = sessionResult.sessionData || {};
          const sessionSites = Object.keys(sessionData);
          const uncategorizedSites = sessionSites.filter(
            (site) =>
              !productiveSites.includes(site) &&
              !unproductiveSites.includes(site)
          );
          renderLists(productiveSites, unproductiveSites, uncategorizedSites);
        });
      }
    );
  }

  addProductiveInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSite(addProductiveInput.value.trim(), "productive");
      addProductiveInput.value = "";
    }
  });

  addUnproductiveInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSite(addUnproductiveInput.value.trim(), "unproductive");
      addUnproductiveInput.value = "";
    }
  });

  // --- HISTORY PAGE LOGIC ---
  function displayHistory() {
    const calendarContainer = document.getElementById("calendar-container");

    chrome.storage.local.get(["dailyProductivityLog"], (result) => {
      const log = result.dailyProductivityLog || {};
      calendarContainer.innerHTML = "";

      displayLongRunStats(log);

      const sortedDates = Object.keys(log).sort();
      if (sortedDates.length === 0) {
        calendarContainer.innerHTML =
          "<p>No daily history has been recorded yet.</p>";
        return;
      }

      const popups = {};
      for (const date of sortedDates) {
        const dayData = log[date];

        const { totalTime, productiveTime } = dayData;

        let score = 0;
        if (totalTime > 0) {
          score = (productiveTime / totalTime) * 100;
        }

        popups[date] = {
          modifier: "bg-blue-400 text-white",
          html: `Productivity: <b>${score.toFixed(
            0
          )}%</b><br>Total Time: <b>${formatTime(totalTime)}</b>`,
        };
      }

      const localToday = new Date();
      const localTodayStr = `${localToday.getFullYear()}-${String(
        localToday.getMonth() + 1
      ).padStart(2, "0")}-${String(localToday.getDate()).padStart(2, "0")}`;

      const options = {
        settings: {
          range: {
            min: sortedDates[0],
            max: localTodayStr,
          },
          visibility: {
            theme: "light",
            weekNumbers: false,
          },
          selection: {
            day: false,
          },
        },
        popups: popups,
        actions: {
          onRender: (self) => {
            const dayElements = self.HTMLElement.querySelectorAll(
              ".vanilla-calendar-day__btn"
            );
            dayElements.forEach((dayEl) => {
              const dayDate = dayEl.dataset.calendarDay;
              if (log[dayDate]) {
                const { totalTime, productiveTime } = log[dayDate];
                let score = 0;
                if (totalTime > 0) {
                  score = (productiveTime / totalTime) * 100;
                }

                const scoreEl = document.createElement("div");
                scoreEl.className = "productivity-score";
                scoreEl.textContent = `${score.toFixed(0)}%`;
                dayEl.appendChild(scoreEl);
              }
            });
          },
        },
      };

      const calendar = new VanillaCalendar("#calendar-container", options);
      calendar.init();
    });
  }

  function displayLongRunStats(log) {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    let stats = {
      today: { productiveTime: 0, totalTime: 0 },
      week: { productiveTime: 0, totalTime: 0 },
      month: { productiveTime: 0, totalTime: 0 },
      allTime: { productiveTime: 0, totalTime: 0 },
    };

    for (const dateStr in log) {
      const entry = log[dateStr];
      const dateParts = dateStr.split("-").map((part) => parseInt(part, 10));
      const entryDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

      stats.allTime.productiveTime += entry.productiveTime;
      stats.allTime.totalTime += entry.totalTime;

      if (
        entryDate.getFullYear() === currentYear &&
        entryDate.getMonth() === currentMonth
      ) {
        stats.month.productiveTime += entry.productiveTime;
        stats.month.totalTime += entry.totalTime;
      }

      if (entryDate >= startOfWeek && entryDate <= today) {
        stats.week.productiveTime += entry.productiveTime;
        stats.week.totalTime += entry.totalTime;
      }

      if (dateStr === todayStr) {
        stats.today.productiveTime = entry.productiveTime;
        stats.today.totalTime = entry.totalTime;
      }
    }

    const formatStatString = (period) => {
      const { productiveTime, totalTime } = stats[period];
      if (totalTime === 0) {
        return "No activity recorded.";
      }
      const score = ((productiveTime / totalTime) * 100).toFixed(0);
      const hours = (totalTime / 3600).toFixed(1);
      return `${score}% productive for ${hours} hours.`;
    };

    document.getElementById("stats-today").textContent =
      formatStatString("today");
    document.getElementById("stats-week").textContent =
      formatStatString("week");
    document.getElementById("stats-month").textContent =
      formatStatString("month");
    document.getElementById("stats-all-time").textContent =
      formatStatString("allTime");
  }

  transferBtn.addEventListener("click", () => {
    chrome.storage.local.set({ currentPlantId: null }, () => {
      console.log("Current plant transferred. Set to null.");
      displayCurrentPlant();
      updatePlantDropdown();
      updateFertilizerDropdown();
      updatePotionDropdown();
    });
  });

  reviveBtn.addEventListener("click", (event) => {
    reviveDropdown.classList.toggle("open");
    seedDropdown.classList.remove("open");
    fertilizerDropdown.classList.remove("open");
    event.stopPropagation();
  });

  sellPlantBtn.addEventListener("click", (event) => {
    document.getElementById("sell-plant-dropdown").classList.toggle("open");
    event.stopPropagation();
  });

  document
    .getElementById("back-to-garden-btn")
    .addEventListener("click", () => {
      const gardenNavButton = document.querySelector(
        'nav .radio[data-page="garden-page"]'
      );
      if (gardenNavButton) gardenNavButton.click();
    });

  document.getElementById("garden-nav-left").addEventListener("click", () => {
    if (currentGardenPage > 0) {
      currentGardenPage--;
      updateGardenDisplay();
    }
  });

  document.getElementById("garden-nav-right").addEventListener("click", () => {
    const pageCount = document.querySelectorAll(".garden-plot-page").length;
    if (currentGardenPage < pageCount - 1) {
      currentGardenPage++;
      updateGardenDisplay();
    }
  });

  document.getElementById("go-to-shop-btn").addEventListener("click", () => {
    const shopNavButton = document.querySelector(
      'nav .radio[data-page="shop-page"]'
    );
    if (shopNavButton) {
      shopNavButton.click();
    }
  });

  plantBtn.addEventListener("click", (event) => {
    seedDropdown.classList.toggle("open");
    fertilizerDropdown.classList.remove("open");
    reviveDropdown.classList.remove("open");
    event.stopPropagation();
  });

  fertilizerBtn.addEventListener("click", (event) => {
    fertilizerDropdown.classList.toggle("open");
    seedDropdown.classList.remove("open");
    reviveDropdown.classList.remove("open");
    event.stopPropagation();
  });

  document.addEventListener("click", (event) => {
    if (
      !plantBtn.contains(event.target) &&
      !fertilizerBtn.contains(event.target) &&
      !reviveBtn.contains(event.target) &&
      !sellPlantBtn.contains(event.target)
    ) {
      seedDropdown.classList.remove("open");
      fertilizerDropdown.classList.remove("open");
      reviveDropdown.classList.remove("open");
      document.getElementById("sell-plant-dropdown").classList.remove("open");
    }
  });

  const statsPage = document.getElementById("stats-page");
  const historyPage = document.getElementById("history-page");
  const viewHistoryBtn = document.getElementById("view-history-btn");
  const backToStatsBtn = document.getElementById("back-to-stats-btn");
  const resetSessionBtn = document.getElementById("reset-session-btn");
  const waterBtn = document.getElementById("action-water");
  waterBtn.addEventListener("click", waterPlant);

  resetSessionBtn.addEventListener("click", () => {
    chrome.storage.session.set({ sessionData: {} }, () => {
      console.log("Session data has been reset.");
      chrome.runtime.sendMessage({ action: "resetSession" });
      displayStats();
    });
  });

  viewHistoryBtn.addEventListener("click", () => {
    statsPage.classList.remove("active");
    historyPage.classList.add("active");
    displayHistory();
  });
  backToStatsBtn.addEventListener("click", () => {
    historyPage.classList.remove("active");
    statsPage.classList.add("active");
  });

  navItems.forEach((item) => {
    item.addEventListener("click", async () => {
      const targetPageId = item.dataset.page;
      pages.forEach((page) => {
        page.classList.toggle("active", page.id === targetPageId);
      });

      if (targetPageId === "home-page") {
        displayCurrentPlant();
        updatePlantDropdown();
        updateFertilizerDropdown();
        updatePotionDropdown();
        updateWaterLevelDisplay();
        displayActivityLog();
      } else if (targetPageId === "stats-page") {
        displayStats();
      } else if (targetPageId === "categorization-page") {
        initializeCategorizationPage();
      } else if (targetPageId === "garden-page") {
        await updateGardenPage();
      } else if (targetPageId === "shop-page") {
        await displayShop();
      }
    });
  });
  displayCurrentPlant();
  updatePlantDropdown();
  updateFertilizerDropdown();
  updatePotionDropdown();
  updateWaterLevelDisplay();
  displayActivityLog();
});
