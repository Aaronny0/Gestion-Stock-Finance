import { installEarlyHistoryDispatcher } from "./frontend/history-bootstrap";
// Synchronous bootstrap, before router hydration and form cleanup listeners.
installEarlyHistoryDispatcher();
