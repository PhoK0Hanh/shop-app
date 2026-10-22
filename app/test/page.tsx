import styles from "./test.module.css";

// Trang đích tạm cho các liên kết chưa có nội dung trong footer.
export default function TestPage() {
  const text = "Đây là page test";

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <h1 aria-label={text} className="text-center text-3xl font-bold">
        {/* Lệch thời điểm chuyển động của từng ký tự để tạo sóng chạy qua dòng chữ. */}
        <span aria-hidden="true" className="inline-block whitespace-nowrap">
          {Array.from(text).map((character, index) => (
            <span
              key={index}
              className={styles.letter}
              style={{ animationDelay: `${index * 0.09}s` }}
            >
              {character === " " ? "\u00a0" : character}
            </span>
          ))}
        </span>
      </h1>
    </div>
  );
}
