import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

const ProfilePhotoCropper = ({ imageSrc, onCroppedBlobChange }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // When cropping stops, react-easy-crop gives you croppedAreaPixels
  const onCropCompleteHandler = useCallback(async (_, croppedAreaPixels) => {
    // make a blob immediately
    const canvas = document.createElement("canvas");
    const image = new Image();
    image.src = imageSrc;
    await image.decode();

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    canvas.toBlob((blob) => {
      if (onCroppedBlobChange) onCroppedBlobChange(blob);
    }, "image/jpeg");
  }, [imageSrc, onCroppedBlobChange]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-full h-80 bg-black">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropCompleteHandler} // fires after user stops moving/zooming
        />
      </div>
    </div>
  );
};

export default ProfilePhotoCropper;