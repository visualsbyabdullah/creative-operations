import { describe,expect,it } from "vitest";
import {
  extensionFor,
  signatureMatches,
  validateFileMetadata,
} from "@/lib/storage/file-validation";

describe("private Storage file validation",()=>{
  it("uses strict kind-specific MIME allowlists",()=>{
    expect(extensionFor("avatar","image/webp")).toBe("webp");
    expect(extensionFor("avatar","application/pdf")).toBeNull();
    expect(extensionFor("task","application/x-msdownload")).toBeNull();
    expect(extensionFor("submission","video/mp4")).toBe("mp4");
  });
  it("requires a matching normalized extension and bounded size",()=>{
    expect(validateFileMetadata("avatar",{name:"photo.JPEG",type:"image/jpeg",size:1024}))
      .toEqual({extension:"jpg",safeName:"photo.JPEG"});
    expect(validateFileMetadata("avatar",{name:"photo.exe",type:"image/jpeg",size:1024})).toBeNull();
    expect(validateFileMetadata("avatar",{name:"photo.png",type:"image/png",size:6*1024*1024})).toBeNull();
  });
  it("sanitizes display filenames without using them as object authority",()=>{
    expect(validateFileMetadata("task",{name:"../../brief?.pdf",type:"application/pdf",size:20}))
      .toEqual({extension:"pdf",safeName:".._.._brief_.pdf"});
  });
  it("checks file signatures instead of trusting browser MIME metadata",()=>{
    expect(signatureMatches("image/png",new Uint8Array([137,80,78,71,13,10,26,10]))).toBe(true);
    expect(signatureMatches("image/png",new Uint8Array([77,90,0,0,0,0,0,0]))).toBe(false);
    expect(signatureMatches("application/pdf",new TextEncoder().encode("%PDF-1.7"))).toBe(true);
  });
});
