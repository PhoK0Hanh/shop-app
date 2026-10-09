"use client";

import { useState } from "react";

export default function ProductDetailsTabs({
  description,
}: {
  description: string;
}) {
  const [activeTab, setActiveTab] = useState("description");
  // Chính sách dùng nội dung tạm bằng tiếng Việt, chưa công bố điều kiện mua hàng.
  const tabs = [
    { id: "description", title: "Mô tả", content: description },
    {
      id: "shipping",
      title: "Chính sách giao hàng",
      content:
        "Nội dung chính sách giao hàng đang được cập nhật. Thông tin về khu vực giao hàng, thời gian dự kiến và phí vận chuyển sẽ được bổ sung tại đây.",
    },
    {
      id: "returns",
      title: "Chính sách đổi hàng",
      content:
        "Nội dung chính sách đổi hàng đang được cập nhật. Điều kiện đổi hàng, thời hạn và hướng dẫn thực hiện sẽ được bổ sung tại đây.",
    },
  ];
  const selectedTab = tabs.find((tab) => tab.id === activeTab)!;

  return (
    <section className="mt-12">
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`min-w-0 flex-1 border-b-2 px-2 py-4 text-sm transition-colors sm:text-base ${
              activeTab === tab.id
                ? "border-black font-bold text-black"
                : "border-transparent text-gray-500 hover:text-black"
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="py-6">
        <h2 className="mb-3 text-xl font-bold">{selectedTab.title}</h2>
        <p className="whitespace-pre-line leading-relaxed text-gray-600">
          {selectedTab.content}
        </p>
      </div>
    </section>
  );
}
