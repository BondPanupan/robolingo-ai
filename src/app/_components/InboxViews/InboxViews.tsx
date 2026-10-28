import styles from "./InboxViews.module.css";

export type InboxView = "all" | "unread";

export const VIEW_LABEL: Record<InboxView, string> = {
  all: "ทั้งหมด",
  unread: "ยังไม่อ่าน",
};

interface InboxViewsProps {
  view: InboxView;
  counts: Record<InboxView, number>;
  onChange: (view: InboxView) => void;
}

export function InboxViews({ view, counts, onChange }: InboxViewsProps) {
  return (
    <nav className={styles.sidebar} aria-label="มุมมอง Inbox">
      <h2 className={styles.heading}>Inbox</h2>
      <ul className={styles.list}>
        {(Object.keys(VIEW_LABEL) as InboxView[]).map((v) => (
          <li key={v}>
            <button
              className={styles.item}
              aria-current={view === v}
              onClick={() => onChange(v)}
            >
              <span>{VIEW_LABEL[v]}</span>
              <span className={styles.count}>{counts[v]}</span>
            </button>
          </li>
        ))}
      </ul>

      <h3 className={styles.section}>ช่องทาง</h3>
      <ul className={styles.list}>
        <li className={styles.channel}>
          <span className={styles.lineDot} aria-hidden />
          LINE Official Account
        </li>
      </ul>
    </nav>
  );
}
