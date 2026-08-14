export type StorageKind = "avatar" | "task" | "submission";

const rules = {
  avatar: {
    max: 5 * 1024 * 1024,
    mime: {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    },
  },
  task: {
    max: 25 * 1024 * 1024,
    mime: {
      "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
      "application/pdf": "pdf", "text/plain": "txt",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    },
  },
  submission: {
    max: 25 * 1024 * 1024,
    mime: {
      "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
      "application/pdf": "pdf", "video/mp4": "mp4", "video/webm": "webm",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    },
  },
} as const;

export function extensionFor(kind:StorageKind,mime:string):string|null {
  return (rules[kind].mime as Record<string,string>)[mime]??null;
}

export function validateFileMetadata(
  kind:StorageKind,file:{name:string;type:string;size:number},
):{extension:string;safeName:string}|null {
  const extension=extensionFor(kind,file.type);
  if(!extension||file.size<1||file.size>rules[kind].max)return null;
  const supplied=file.name.split(".").pop()?.toLowerCase();
  if(supplied!==extension&&!(extension==="jpg"&&supplied==="jpeg"))return null;
  const safeName=file.name.replace(/[^A-Za-z0-9._ -]/g,"_").slice(0,255).trim();
  return safeName?{extension,safeName}:null;
}

export function signatureMatches(mime:string,bytes:Uint8Array):boolean {
  if(mime==="image/jpeg")return bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
  if(mime==="image/png")return bytes.slice(0,8).join(",")==="137,80,78,71,13,10,26,10";
  if(mime==="image/webp")return new TextDecoder().decode(bytes.slice(0,4))==="RIFF"
    &&new TextDecoder().decode(bytes.slice(8,12))==="WEBP";
  if(mime==="application/pdf")return new TextDecoder().decode(bytes.slice(0,5))==="%PDF-";
  if(mime==="video/mp4")return new TextDecoder().decode(bytes.slice(4,8))==="ftyp";
  if(mime==="video/webm")return bytes.slice(0,4).join(",")==="26,69,223,163";
  if(mime==="text/plain")return !bytes.slice(0,512).some((value)=>value===0);
  if(mime.includes("openxmlformats-officedocument"))return bytes[0]===0x50&&bytes[1]===0x4b;
  return false;
}
