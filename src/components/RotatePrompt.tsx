export function RotatePrompt() {
  return (
    <div className="rotate-prompt" role="alert">
      <div className="rotate-device" aria-hidden="true">
        <div className="rotate-screen">
          <svg viewBox="0 0 40 30"><path d="M4 22h24M24 17l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 18V6M4 10l4-4 4 4" fill="none" stroke="#ff5a36" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
      <h2>กรุณาหมุนอุปกรณ์เป็นแนวนอน</h2>
      <p>สื่อการสอนนี้ออกแบบสำหรับการแสดงผลแนวนอน เพื่อให้ภาพและคำอธิบายชัดเจนที่สุด</p>
    </div>
  );
}
