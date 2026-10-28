import styles from "./TopBar.module.css";

interface TopBarProps {
  /** False while the conversations poll is failing. */
  online: boolean;
  /** เสียงแจ้งเตือนข้อความใหม่ — ไม่ส่ง onSoundChange = ไม่แสดงปุ่ม */
  soundEnabled?: boolean;
  onSoundChange?: (enabled: boolean) => void;
}

/** ลำโพง; ปิดเสียง = มีกากบาทแทนคลื่นเสียง — สีตาม currentColor */
function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2.5 6h2.5l3.5-3v10L5 10H2.5z" fill="currentColor" />
      {muted ? (
        <path d="M11 6l3.5 4M14.5 6 11 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      ) : (
        <path
          d="M11 5.5a3.5 3.5 0 0 1 0 5M12.75 3.5a6 6 0 0 1 0 9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function TopBar({ online, soundEnabled = true, onSoundChange }: TopBarProps) {
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
      {onSoundChange && (
        <button
          type="button"
          className={styles.sound}
          aria-pressed={soundEnabled}
          onClick={() => onSoundChange(!soundEnabled)}
          title={soundEnabled ? "ปิดเสียงแจ้งเตือนข้อความใหม่" : "เปิดเสียงแจ้งเตือนข้อความใหม่"}
        >
          <SoundIcon muted={!soundEnabled} />
          <span className={styles.soundLabel}>{soundEnabled ? "เสียงเปิด" : "เสียงปิด"}</span>
        </button>
      )}
    </header>
  );
}
