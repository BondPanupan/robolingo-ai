import styles from "./TopBar.module.css";

interface TopBarProps {
  /** False while the conversations poll is failing. */
  online: boolean;
}

export function TopBar({ online }: TopBarProps) {
  return (
    <header className={styles.bar}>
      <span className={styles.brand}>
        <span className={styles.mark} aria-hidden>
          R
        </span>
        Robolingo
      </span>
      <nav className={styles.nav} aria-label="เมนูหลัก">
        <span className={styles.navItem} aria-current="page">
          Inbox
        </span>
      </nav>
      <span className={styles.status} data-online={online}>
        <span className={styles.dot} aria-hidden />
        {online ? "LINE เชื่อมต่อแล้ว" : "ขาดการเชื่อมต่อ"}
      </span>
    </header>
  );
}
