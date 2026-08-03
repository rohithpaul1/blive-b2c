import { useState, useRef } from "react";
import toast from "react-hot-toast";

const UploadCard = ({ label, sublabel, valueKey, onUploadComplete, uploadedDocument }) => {
  const [fileData, setFileData] = useState(null);
  const [progress, setProgress] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadInterval = useRef(null);
  const inputRef = useRef(null); // file input ref

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setFileData({ file, previewUrl });
    setProgress(0);
    setIsUploading(true);

    let prog = 0;
    uploadInterval.current = setInterval(() => {
      prog += 20; // smaller increments
      if (Math.random() < 0.00) {
        // 2% chance to fail
        clearInterval(uploadInterval.current);
        setProgress(null);
        setIsUploading(false);
        setFileData(null);
        if (inputRef.current) inputRef.current.value = "";
        toast.error("Upload failed. Please try again.");
        if (onUploadComplete) {
          onUploadComplete(valueKey, null, null);
        }
        return;
      }

      setProgress(prog);

      if (prog >= 100) {
        clearInterval(uploadInterval.current);
        setProgress(null);
        setIsUploading(false);

        const uploadedLink = `https://fake-server.com/uploads/${file.name}`;
        if (onUploadComplete) {
          onUploadComplete(valueKey, uploadedLink, file);
        }
      }
    }, 500); // update every 50ms
  };

  const handleRemove = () => {
    if (isUploading && uploadInterval.current) {
      clearInterval(uploadInterval.current);
    }
    setFileData(null);
    setProgress(null);
    setIsUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (onUploadComplete) {
      onUploadComplete(valueKey, null, null);
    }
  };

  const handleReupload = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className="relative">
      {fileData && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute z-20 flex items-center justify-center cursor-pointer font-bold top-0 right-0 translate-x-1/3 -translate-y-1/3 bg-[#FFFFFF] w-[36px] h-[36px] text-black text-[18px] rounded-full border border-[#D9D9D9]"
        >
          ✕
        </button>
      )}

      <div className="relative w-[172px] h-[142px] flex flex-col items-center justify-center rounded-[8px] bg-[#F7F7F7] overflow-hidden">
        {fileData ? (
          <>
            <img
              src={fileData.previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />

            {progress !== null && (
              <div className="absolute inset-0 bg-[#212121CC] flex items-center justify-center z-10">
                <div className="relative w-[60px] h-[60px]">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="30"
                      cy="30"
                      r="26"
                      stroke="#000214"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="30"
                      cy="30"
                      r="26"
                      stroke="#FFFFFF"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={2 * Math.PI * 26}
                      strokeDashoffset={
                        2 * Math.PI * 26 -
                        (progress / 100) * (2 * Math.PI * 26)
                      }
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 0.1s linear" }} // smooth transition
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[#FDFDFD] font-bold text-[12px]">
                    {progress}%
                  </span>
                </div>
              </div>
            )}
          </>
        ) : uploadedDocument ? (
          <div className="relative w-full h-full group">
            <img
              src={uploadedDocument.imageUrlFront}
              alt="Uploaded Document"
              className="w-full h-full object-cover"
            />
            {/* Status indicator */}
            <div className="absolute top-[8px] right-[8px]">
              <div className={`w-[12px] h-[12px] rounded-full ${
                uploadedDocument.status === 'verified' ? 'bg-[#10B981]' : 
                uploadedDocument.status === 'rejected' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'
              }`}></div>
            </div>
            {/* Status text */}
            <div className="absolute bottom-[8px] left-[8px] right-[8px]">
              <p className="text-[10px] text-white bg-black/70 px-[4px] py-[2px] rounded-[4px] text-center">
                {uploadedDocument.status}
              </p>
            </div>
            {/* Replace button - shown on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={handleReupload}
                className="px-[16px] py-[8px] bg-white text-black text-[12px] font-medium rounded-[8px] hover:bg-gray-100 transition-colors"
              >
                Replace
              </button>
            </div>
            {/* Hidden input for re-upload */}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </div>
        ) : (
          <label className="flex flex-col items-center cursor-pointer">
            <img src="/images/upload.png" alt="Upload Icon" />
            <p className="text-[14px] text-[#717171]">{label}</p>
            {sublabel && (
              <p className="text-[12px] text-[#717171]">{sublabel}</p>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
};

export default UploadCard;