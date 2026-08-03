import { useState, useRef } from "react";

const UploadCard = ({ label, sublabel, valueKey, onUploadComplete, uploadedDocument }) => {
  const [fileData, setFileData] = useState(null);

  const inputRef = useRef(null); // file input ref

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Staging is instant and local — we create a preview and hand the file
    // back to the parent. The real network upload happens in the parent via
    // postAPIMedia('/e-kyc/upload-documents') when the user submits, so we do
    // not show a progress percentage here (there is no upload in flight yet).
    const previewUrl = URL.createObjectURL(file);
    setFileData({ file, previewUrl });

    if (onUploadComplete) {
      onUploadComplete(valueKey, previewUrl, file);
    }
  };

  const handleRemove = () => {
    setFileData(null);
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

            {/* Honest local status: the file is selected and will be uploaded
                when the form is submitted. No fake progress percentage. */}
            <div className="absolute bottom-[8px] left-[8px] right-[8px] flex items-center justify-center gap-x-[6px] bg-black/70 rounded-[4px] px-[6px] py-[3px]">
              <span className="w-[8px] h-[8px] rounded-full bg-[#10B981]"></span>
              <p className="text-[10px] text-white">Ready to upload</p>
            </div>
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
