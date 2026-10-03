"use client";

import { Slider } from "@base-ui/react/slider";
import { SlidersHorizontal } from "lucide-react";
import type { Category, Size, Style } from "@/lib/mock-data";
import { createDefaultFilters, minFilterPrice, maxFilterPrice } from "@/lib/product-filters";
import type { ProductFilters } from "@/lib/product-filters";

interface ProductFilterProps {
  categories: Category[];
  styles: Style[];
  value: ProductFilters;
  onChange: (filters: ProductFilters) => void;
  onApply: (filters: ProductFilters) => void;
}

const sizes: Size[] = ["S", "M", "L", "XL", "XXL"];
const minPrice = minFilterPrice;
const maxPrice = maxFilterPrice;
const priceFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function optionClass(selected: boolean) {
  return `rounded-xl border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${
    selected
      ? "border-black bg-black text-white"
      : "border-gray-200 bg-white text-black hover:border-black"
  }`;
}

export default function ProductFilter({
  categories,
  styles,
  value,
  onChange,
  onApply,
}: ProductFilterProps) {
  const { categoryId: selectedCategory, styleIds: selectedStyles, size: selectedSize, priceRange } = value;

  function resetFilters() {
    const defaults = createDefaultFilters();
    onChange(defaults);
    onApply(defaults);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-black">
      <div className="flex items-center justify-between border-b border-gray-200 pb-5">
        <h2 className="text-xl font-bold">Filters</h2>
        <SlidersHorizontal
          aria-hidden="true"
          size={20}
          className="text-gray-500"
        />
      </div>

      <fieldset className="mt-5 border-b border-gray-200 pb-5">
        <legend className="mb-3 text-lg font-bold">Categories</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={selectedCategory === category.id}
              className={optionClass(selectedCategory === category.id)}
              onClick={() =>
                onChange({ ...value, categoryId: selectedCategory === category.id ? null : category.id })
              }
            >
              {category.name}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5 border-b border-gray-200 pb-5">
        <legend className="mb-3 text-lg font-bold">Price</legend>
        <Slider.Root
          value={priceRange}
          onValueChange={(range) => onChange({ ...value, priceRange: [range[0], range[1]] })}
          min={minPrice}
          max={maxPrice}
          step={10000}
          thumbCollisionBehavior="none"
          format={{ style: "currency", currency: "VND" }}
          locale="vi-VN"
        >
          <Slider.Control className="relative flex h-8 w-full touch-none items-center">
            <Slider.Track className="relative h-1.5 w-full rounded-full bg-gray-200">
              <Slider.Indicator className="rounded-full bg-black" />
              {[0, 1].map((index) => (
                <Slider.Thumb
                  key={index}
                  index={index}
                  getAriaLabel={() =>
                    index === 0 ? "Minimum price" : "Maximum price"
                  }
                  getAriaValueText={(_, value) => priceFormatter.format(value)}
                  className="block size-5 rounded-full bg-black ring-2 ring-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-black"
                />
              ))}
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
        <div className="mt-2 flex justify-between gap-2 text-xs font-medium">
          <span>{priceFormatter.format(priceRange[0])}</span>
          <span>{priceFormatter.format(priceRange[1])}</span>
        </div>
      </fieldset>

      <fieldset className="mt-5 border-b border-gray-200 pb-5">
        <legend className="mb-3 text-lg font-bold">Styles</legend>
        <div className="flex flex-wrap gap-2">
          {styles.map((style) => (
            <button
              key={style.id}
              type="button"
              aria-pressed={selectedStyles.includes(style.id)}
              className={optionClass(selectedStyles.includes(style.id))}
              onClick={() =>
                onChange({ ...value, styleIds: toggleValue(selectedStyles, style.id) })
              }
            >
              {style.name}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="mb-3 text-lg font-bold">Size</legend>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              aria-pressed={selectedSize === size}
              className={optionClass(selectedSize === size)}
              onClick={() =>
                onChange({ ...value, size: selectedSize === size ? null : size })
              }
            >
              {size}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={() => onApply({
          categoryId: selectedCategory,
          styleIds: [...selectedStyles],
          size: selectedSize,
          priceRange: [priceRange[0], priceRange[1]],
        })}
        className="mt-6 w-full rounded-full bg-black py-2 text-sm font-medium text-white transition-colors hover:bg-[#383838] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        Apply Filter
      </button>
      <button
        type="button"
        onClick={resetFilters}
        className="mt-3 w-full rounded-full border border-gray-200 py-2 text-sm font-medium hover:border-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        Clear all
      </button>
    </div>
  );
}
