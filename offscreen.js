// offscreen.js

firebase.initializeApp(firebaseConfig);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "firebase-auth") {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      unsubscribe();
      sendResponse(user);
    });
    return true;
  }
});
