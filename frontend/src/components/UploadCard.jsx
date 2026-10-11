import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Brackets } from "./Brackets";
const ACCEPTED = ["image/png", "image/jpeg"];
const MAX_MB = 10;
export function UploadCard({ onFileSelected, disabled }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [localError, setLocalError] = useState(null);
    function accept(file) {
        if (!file || disabled)
            return;
        if (!ACCEPTED.includes(file.type)) {
            setLocalError("Please upload a PNG or JPEG image.");
            return;
        }
        if (file.size > MAX_MB * 1024 * 1024) {
            setLocalError(`File is larger than ${MAX_MB} MB.`);
            return;
        }
        setLocalError(null);
        onFileSelected(file);
    }
    return (<div>
      <motion.button type="button" disabled={disabled} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => inputRef.current?.click()} onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
        }} onDragLeave={() => setDragging(false)} onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            accept(e.dataTransfer.files[0]);
        }} className={`glass relative flex aspect-[16/10] w-full flex-col items-center justify-center overflow-hidden rounded-xl text-center transition-shadow ${dragging ? "glow-accent" : ""}`}>
        <Brackets active={dragging}/>
        <motion.div className="pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-accent/15 to-transparent" animate={{ top: ["-20%", "110%"] }} transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}/>
        <motion.span animate={{ y: dragging ? -4 : 0 }} className="font-display text-lg text-text">
          {dragging ? "Release to analyze" : "Drop a chest X-ray here"}
        </motion.span>
        <span className="mt-1 text-sm text-text-dim">
          or click to browse · PNG / JPEG · up to {MAX_MB} MB
        </span>
      </motion.button>
      <input ref={inputRef} type="file" accept={ACCEPTED.join(",")} className="hidden" onChange={(e) => {
            accept(e.target.files?.[0]);
            e.target.value = "";
        }}/>
      {localError && (<p role="alert" className="mt-3 text-sm text-finding">
          {localError}
        </p>)}
    </div>);
}
