"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  return (
    <div className="min-w-0 w-full max-w-100 lg:w-[48%] lg:max-w-none lg:shrink-0 ">
      {/* Ảnh lớn */}
      <div className="flex w-full items-center justify-center overflow-hidden rounded-lg bg-[#F2F0F1]">
        <Image
          src={selectedImage}
          alt={productName}
          width={400}
          height={533}
          preload
          className="w-[48%] h-auto object-contain object-center"
        />
      </div>

      {/* Dãy thumbnail */}
      <div className="relative flex gap-2 mt-4 overflow-x-auto scroll-smooth pb-2">
        {images.map((img) => (
          <button
            key={img}
            type="button"
            onClick={(event) => {
              setSelectedImage(img);

              const button = event.currentTarget;
              const container = button.parentElement;

              if (container) {
                container.scrollTo({
                  left: button.offsetLeft,
                  behavior: "smooth",
                });
              }
            }}
            className={`overflow-hidden rounded-lg shrink-0 border-2 ${
              selectedImage === img ? "border-black" : "border-transparent"
            }`}
          >
            <Image src={img} alt={productName} width={80} height={107} />
          </button>
        ))}
      </div>
    </div>
  );
}
