import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Banner from "./Banner.jsx";

const html = (props) => renderToStaticMarkup(createElement(Banner, props));

describe("Banner", () => {
  it("displays the text", () => {
    expect(html({ text: "Free shipping" })).toContain("Free shipping");
  });

  it("applies the background color", () => {
    expect(html({ text: "Sale", backgroundColor: "#193B68" })).toMatch(/#193b68/i);
  });

  it("defaults to a white background", () => {
    expect(html({ text: "Sale" })).toMatch(/white|#fff/i);
  });

  it("renders nothing when text is empty or missing", () => {
    expect(html({ text: "" })).toBe("");
    expect(html({})).toBe("");
  });
});
