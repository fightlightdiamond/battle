# Chatbot UI Components

Giao diện chatbot được xây dựng hoàn toàn bằng **shadcn/ui components** có sẵn trong project.

## Components Sử Dụng

### Từ shadcn/ui:

- **Sheet** - Slide-in panel cho chatbot
- **Avatar** - User và bot avatars
- **ScrollArea** - Message list với scroll
- **Input** - Text input field
- **Button** - Send button và FAB
- **Tooltip** - Hints và tooltips

### Custom Components:

- **Chatbot** - Main chatbot component
- **ChatMessage** - Individual message display

## Tính Năng

✅ **Global Access** - Có thể truy cập từ bất kỳ trang nào
✅ **Floating Action Button** - Nút tròn ở góc dưới bên phải
✅ **Slide-in Panel** - Sheet component từ shadcn/ui
✅ **Responsive** - Hoạt động tốt trên mobile và desktop
✅ **Smooth Animations** - Fade in, slide in effects
✅ **Keyboard Shortcuts** - Enter để gửi, Esc để đóng
✅ **Loading States** - Spinner khi đang xử lý
✅ **Bilingual Support** - Sẵn sàng cho Vietnamese/English

## Cách Sử Dụng

Chatbot đã được tích hợp vào `AppLayout`, nên nó sẽ xuất hiện trên mọi trang tự động.

### Mở Chatbot:

- Click vào nút tròn ở góc dưới bên phải
- Hoặc sử dụng keyboard shortcut (sẽ implement sau)

### Gửi Message:

- Gõ lệnh vào input field
- Nhấn Enter hoặc click nút Send
- Shift+Enter để xuống dòng (sẽ implement sau)

## Tích Hợp

```tsx
// Đã tích hợp sẵn trong AppLayout
import { Chatbot } from "@/features/chatbot/components";

// Chatbot tự động xuất hiện ở mọi trang
<AppLayout>{/* Your page content */}</AppLayout>;
```

## Styling

Chatbot sử dụng:

- Tailwind CSS classes
- shadcn/ui design tokens
- Framer Motion animations (có sẵn trong project)
- Lucide React icons (có sẵn trong project)

## Next Steps

Để chatbot hoạt động đầy đủ, cần:

1. ✅ UI Components (Done)
2. ⏳ Tích hợp Zustand store thật
3. ⏳ Kết nối với command parser
4. ⏳ Implement command handlers
5. ⏳ Add keyboard shortcuts (Ctrl+K)

## Demo

Chatbot hiện đang ở chế độ demo với mock data. Khi bạn gõ lệnh, nó sẽ echo lại lệnh đó.

Để test:

1. Mở bất kỳ trang nào trong app
2. Click vào nút chat ở góc dưới phải
3. Gõ "help" hoặc bất kỳ lệnh nào
4. Xem message được hiển thị

## Customization

### Thay đổi vị trí FAB:

```tsx
// Trong Chatbot.tsx
className = "fixed bottom-6 right-6"; // Thay đổi bottom/right/left/top
```

### Thay đổi kích thước Sheet:

```tsx
// Trong Chatbot.tsx
<SheetContent side="right" className="w-full sm:max-w-md"> // Thay đổi max-w
```

### Thay đổi màu sắc:

Sử dụng Tailwind classes hoặc CSS variables từ shadcn/ui theme.
