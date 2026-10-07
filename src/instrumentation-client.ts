import { installEarlyHistoryDispatcher } from "./frontend/history-bootstrap";
// Synchronous bootstrap, before router hydration and form cleanup listeners.
installEarlyHistoryDispatcher();

if (process.env.NODE_ENV === "development" && "serviceWorker" in navigator) {
  void navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      if (registration.active?.scriptURL === `${location.origin}/sw.js`) void registration.unregister();
    }
  });
}
