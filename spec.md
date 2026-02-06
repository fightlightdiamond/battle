Câu trả lời ngắn gọn là Được. Trước khi AI (trí tuệ nhân tạo) bùng nổ, lập trình truyền thống đã làm việc này suốt nhiều thập kỷ.Tuy nhiên, cách thức hoạt động và trải nghiệm sẽ rất khác so với AI hiện đại. Trong lập trình truyền thống, kỹ thuật này thường được gọi là Command Line Interface (CLI), Domain Specific Language (DSL), hoặc Rule-based Parsing (phân tích dựa trên luật).Dưới đây là phân tích chi tiết về cách bạn có thể làm điều này mà không cần AI:1. Cơ chế hoạt động: "Prompt" truyền thống là gì?Nếu không có AI (như ChatGPT hay Gemini) để "hiểu" ngôn ngữ tự nhiên, bạn phải tự xây dựng bộ quy tắc để máy tính dịch từ văn bản sang lệnh code.Quy trình xử lý sẽ diễn ra như sau:Input: Người dùng nhập: "Tạo một hình vuông màu đỏ".Tokenization (Tách từ): Chương trình tách câu thành các từ khóa: ["Tạo", "hình vuông", "màu đỏ"].Parsing (Phân tích cú pháp): Chương trình so sánh từ khóa với "từ điển" đã lập trình sẵn:Thấy chữ "Tạo" $\rightarrow$ Gọi hàm CreateObject().Thấy chữ "hình vuông" $\rightarrow$ Gán tham số type = square.Thấy chữ "màu đỏ" $\rightarrow$ Gán tham số color = red.Execution (Thực thi): Chạy hàm CreateObject(square, red).2. Các phương pháp kỹ thuật để thực hiệnĐể làm được ứng dụng "code bằng prompt" theo kiểu truyền thống, bạn sẽ sử dụng các kỹ thuật sau:A. Regular Expressions (Regex - Biểu thức chính quy)Đây là cách phổ biến nhất. Bạn viết các mẫu (pattern) để bắt dính chuỗi ký tự.Ví dụ: Nếu người dùng nhập chuỗi khớp với mẫu tạo nút tên là (._), chương trình sẽ lấy nội dung trong (._) làm tên nút và tạo ra code HTML tương ứng.B. Xây dựng Parser (Trình phân tích cú pháp)Bạn tạo ra một ngôn ngữ riêng (DSL) với ngữ pháp chặt chẽ.Ví dụ: SQL là một dạng "prompt" truyền thống kinh điển.Prompt: SELECT name FROM users WHERE age > 18Kết quả: Máy tính trả về danh sách người dùng.Nếu bạn gõ sai cú pháp (ví dụ: GIVE ME name), máy sẽ báo lỗi ngay lập tức (Syntax Error) vì nó không hiểu.C. Lập trình theo mẫu (Template-based)Bạn soạn sẵn các đoạn code mẫu (skeleton code). "Prompt" của người dùng chỉ đơn giản là điền vào chỗ trống.Prompt: make-web --title="Hello" --color="blue"Hệ thống: Lấy file mẫu HTML, thay thế biến {title} bằng "Hello" và {color} bằng "blue".
Trong thế giới JavaScript (JS), hệ sinh thái cho việc xử lý ngôn ngữ tự nhiên (NLP) "thuần túy" cũng mạnh mẽ không kém Python, thậm chí một số thư viện còn tối ưu cực tốt để chạy ngay trên trình duyệt (Client-side) nhằm giảm tải cho server.

Dưới đây là các "ứng cử viên" sáng giá nhất trong JS để bạn xây dựng hệ thống tiền xử lý prompt:

1. Fuse.js (Thay thế cho TheFuzz/FuzzyWuzzy)
   Đây là thư viện Fuzzy Search phổ biến nhất trong giới JS. Nó cực nhẹ, không có phụ thuộc (zero-dependency) và hoạt động dựa trên thuật toán tìm kiếm gần đúng.

Điểm mạnh: Cực kỳ hiệu quả khi bạn có một danh sách các lệnh (Array of objects) và muốn tìm kiếm xem người dùng đang gõ gần giống lệnh nào nhất.

Ví dụ: Người dùng gõ "nút", nó có thể gợi ý "button" nếu bạn thiết lập trọng số (weight) đúng.

Cài đặt: npm install fuse.js

2. Natural (Thư viện NLP toàn diện nhất)
   Nếu Python có NLTK thì JS có Natural. Đây là "con dao pha" cho mọi bài toán xử lý văn bản truyền thống.

Tính năng: \* Distance: Có đủ Levenshtein, Jaro-Winkler, Dice's Co-efficient.

Phonetic: Có Metaphone và Soundex (so khớp theo âm thanh).

Stemming: Đưa từ về dạng gốc (ví dụ: "running" -> "run").

Cài đặt: npm install natural

3. Compromise (Cực kỳ thông minh và vui nhộn)
   Đây là thư viện tôi khuyên dùng nhất nếu bạn muốn làm "Prompt-to-code". Nó không đi sâu vào toán học khô khan mà tập trung vào việc hiểu cấu trúc câu mà không cần AI.

Cách hoạt động: Nó "đọc" câu của người dùng và tách ra được đâu là động từ, danh từ, số lượng, ngày tháng.

Ví dụ: Nếu người dùng nhập "tạo 3 cái nút màu đỏ", compromise sẽ giúp bạn bóc tách ngay lập tức: action: tạo, quantity: 3, object: nút, color: đỏ.

Cài đặt: npm install compromise

4. String-similarity
   Nếu bạn chỉ cần một thứ đơn giản nhất để so sánh độ giống nhau giữa 2 chuỗi (dùng thuật toán Dice's Coefficient).

Điểm mạnh: Siêu nhanh, siêu nhẹ. Phù hợp để kiểm tra lỗi chính tả nhanh.

Cài đặt: npm install string-similarity
Luồng xử lý (Pipeline) lý tưởng trong JS:
Chuẩn hóa: Dùng .toLowerCase() và Regex để dọn dẹp chuỗi.

Sửa lỗi: Dùng string-similarity hoặc natural để nắn lại các từ sai chính tả.

Bóc tách: Dùng compromise để lấy ra các tham số (ví dụ: màu sắc, kích thước).

Khớp lệnh: Dùng Fuse.js để chốt xem cuối cùng là thực thi hàm nào.
