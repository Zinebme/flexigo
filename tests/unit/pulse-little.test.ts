import {describe,expect,it} from "vitest";
import {getTemplate,READY_TEMPLATE_KEYS,defaultHomeSections,defaultPages,templatePreviewPath} from "@/lib/templates/defaults";
import {isPulseTemplate} from "@/lib/templates/pulse";
import {isLittleTemplate} from "@/lib/templates/little";

describe("PULSE and LITTLE templates",()=>{
  it("registers both as production-ready ecommerce templates",()=>{
    expect(READY_TEMPLATE_KEYS).toContain("pulse-v1");
    expect(READY_TEMPLATE_KEYS).toContain("little-v1");
    expect(isPulseTemplate("pulse-v1")).toBe(true);
    expect(isLittleTemplate("little-v1")).toBe(true);
    expect(getTemplate("pulse-v1")?.category).toBe("Sport");
    expect(getTemplate("little-v1")?.category).toBe("Baby");
  });
  it("exposes preview routes",()=>{
    expect(templatePreviewPath("pulse-v1")).toBe("/preview/pulse");
    expect(templatePreviewPath("little-v1")).toBe("/preview/little");
  });
  it("creates rich Arabic structured defaults",()=>{
    const pulse=defaultHomeSections("pulse-v1","ecommerce","نبض");
    const little=defaultHomeSections("little-v1","ecommerce","ليتل");
    expect(pulse.length).toBeGreaterThanOrEqual(8);
    expect(little.length).toBeGreaterThanOrEqual(8);
    expect(pulse[0]?.type).toBe("hero");
    expect(little[0]?.type).toBe("hero");
    expect(JSON.stringify(little)).not.toMatch(/<script|javascript:/i);
  });
  it("creates shop and legal pages",()=>{
    for(const key of ["pulse-v1","little-v1"]){
      const pages=defaultPages(key,"ecommerce","Demo");
      expect(pages.some(p=>p.key==="home")).toBe(true);
      expect(pages.some(p=>p.key==="shop")).toBe(true);
      expect(pages.some(p=>p.key==="legal-privacy")).toBe(true);
    }
  });
});
