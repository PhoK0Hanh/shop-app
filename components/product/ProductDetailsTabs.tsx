"use client";

import { useState } from "react";

export default function ProductDetailsTabs({
  description,
}: {
  description: string;
}) {
  const [activeTab, setActiveTab] = useState("description");
  const tabs = [
    { id: "description", title: "Mô tả", content: description },
    {
      id: "shipping",
      title: "Chính sách giao hàng",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    },
    {
      id: "returns",
      title: "Chính sách đổi hàng",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
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
