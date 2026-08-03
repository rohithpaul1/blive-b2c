import { useState, useEffect } from 'react';
 
const ToggleButton = ({ id, defaultChecked, onChange, disabled }) => {
  const [isOn, setIsOn] = useState(defaultChecked || false);
 
  useEffect(() => {
    setIsOn(defaultChecked);
  }, [defaultChecked]);
 
  const toggle = () => {
    if (disabled) return;
    setIsOn(!isOn);
    onChange && onChange(!isOn); // Call onChange if provided
  };
 
  return (
    <div
      id={id}
      onClick={toggle}
      className={`w-[32px] h-[18px] flex ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} items-center rounded-full p-[2px] transition-colors duration-300 ${
        isOn ? 'bg-[#1B29A9]' : 'bg-[#CBCBCB]'
      }`}
    >
      <div
        className={`bg-white w-[14px] h-[14px] rounded-full transform transition-transform duration-300 ${
          isOn ? 'translate-x-[100%]' : 'translate-x-0'
        }`}
      />
    </div>
  );
};
 
export default ToggleButton;