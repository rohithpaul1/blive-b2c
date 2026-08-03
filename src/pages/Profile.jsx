import { useContext, useState } from 'react';
import Navbar from '../sections/Navbar';
import { UserContext } from '../contexts/UserContext';
import ProfilePhotoCropper from '../components/ProfilePhotoCropper';
import { postAPIMedia, getAPI } from '../caller/axiosUrls';
import toast from 'react-hot-toast';
import Login from '../components/Login';
import Loader from '../components/Loader';

const Profile = () => {
    const { userData, setUserData, isAuthenticated, loading } = useContext(UserContext);
    const [showImageChange, setShowImageChange] = useState(false);
    const [changeImage, setChangeImage] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [croppedImage, setCroppedImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Show loading if user data is still loading
    if (loading) {
        return <Loader />;
    }

    // Show login if not authenticated
    if (!isAuthenticated || !userData) {
        return <Login />;
    }

    // Fetch updated user information after image upload
    const fetchUpdatedUserInfo = async () => {
        try {
            console.log('🔍 Fetching updated user information...');
            const response = await getAPI(`/user-onboarding/user-information/${userData.id}`);
            
            console.log('🔍 User information API response:', response);
            
            if (response.status === 'success' && response.data) {
                const updatedUserData = {
                    ...userData,
                    ...response.data,
                    profileImage: response.data.profileUrl || response.data.profileImage
                };
                
                // Update context
                setUserData(updatedUserData);
                
                // Update localStorage and sessionStorage
                localStorage.setItem('userData', JSON.stringify(updatedUserData));
                sessionStorage.setItem('userData', JSON.stringify(updatedUserData));
                
                console.log('🔍 Updated user data with profile URL:', response.data.profileUrl);
                return response.data.profileUrl;
            }
        } catch (error) {
            console.error('Error fetching updated user info:', error);
        }
        return null;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
        const reader = new FileReader();
        reader.onload = () => setSelectedImage(reader.result);
        reader.readAsDataURL(file);
        }
    };

    const handleChangeImage = async () => {
        if (!croppedImage || !userData?.id) {
            toast.error("No image selected or user not found");
            return;
        }

        try {
            setUploading(true);
            
            // Convert blob to file
            const file = new File([croppedImage], 'profile-image.png', {
                type: 'image/png',
                lastModified: Date.now()
            });
            
            // Create FormData
            const formData = new FormData();
            formData.append('image', file);
            
            console.log('🔍 Uploading profile image:', {
                userId: userData.id,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type
            });
            
            // Call the API
            const response = await postAPIMedia(`/user-onboarding/update-user-image/${userData.id}`, formData);
            
            console.log('🔍 Profile image upload response:', response);
            
            if (response.status === 'success') {
                // Show success message
                toast.success("🎉 Profile picture updated successfully!", {
                    duration: 4000,
                    style: {
                        background: '#10B981',
                        color: '#fff',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        padding: '16px 24px',
                        borderRadius: '12px'
                    }
                });
                
                // Fetch updated user information to get the actual profile URL
                const profileUrl = await fetchUpdatedUserInfo();
                
                if (profileUrl) {
                    console.log('🔍 Profile URL updated:', profileUrl);
                }
                
                // Close modal and reset state
                setShowImageChange(false);
                setSelectedImage(null);
                setCroppedImage(null);
                setChangeImage(false);
            } else {
                toast.error(response.message || "Failed to update profile picture");
            }
        } catch (error) {
            console.error('Error uploading profile image:', error);
            toast.error(error.message || "Failed to update profile picture. Please try again.");
        } finally {
            setUploading(false);
        }
    }
    
    return (
        <>
            <div className="w-full h-dvh overflow-x-hidden flex flex-col items-center">
                {showImageChange && 
                <div className="fixed z-50 w-screen h-screen top-0 left-0 bg-black/50 flex items-center justify-center">
                    <div className="relative w-[664px] max-h-[600px] rounded-[16px] login-shadow bg-white overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="py-[24px] flex items-center header-shadow px-[32px]">
                            <div className="flex flex-1 items-center gap-x-[20px]">
                            {changeImage && <img
                                onClick={() => {
                                    setChangeImage(false);
                                    setSelectedImage(null);
                                }}
                                className="cursor-pointer w-[24px] aspect-square"
                                src="/images/Chevron-Left.png"
                                alt="Chevron Icon"
                            />}
                            <div className="flex flex-col">
                                <p className="font-bold text-[24px] text-[#212121]">Update Profile Picture</p>
                                <p className='text-[14px] text-[#3A3A3A]'>A profile picture help others to recognize you easily</p>
                            </div>
                            </div>
                            <img
                            onClick={() => {
                                setShowImageChange(false);
                            }}
                            className="w-[24px] aspect-square cursor-pointer"
                            src="/images/Close.png"
                            alt="Close Icon"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto flex flex-col py-[16px] px-[32px]">
                            {changeImage && <div className=''>
                                {!selectedImage && <div className="w-full flex flex-col items-center">
                                    <label
                                        htmlFor="fileUpload"
                                        className="
                                        w-full 
                                        h-64 
                                        flex 
                                        flex-col 
                                        items-center 
                                        justify-center 
                                        border-2 
                                        border-dashed 
                                        border-gray-300 
                                        rounded-xl 
                                        cursor-pointer 
                                        hover:border-gray-400
                                        bg-gray-50
                                        "
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                        {/* icon */}
                                        <svg
                                            className="w-12 h-12 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 15a4 4 0 004 4h10a4 4 0 004-4m-4-4l-4-4m0 0l-4 4m4-4v12"
                                            />
                                        </svg>
                                        <p className="mt-2 text-gray-700 font-medium">Drag your photo here</p>
                                        <p className="text-sm text-gray-500">Supports JPEG & PNG</p>
                                        </div>

                                        <span className="mt-2 text-gray-400">or</span>
                                        <span className="mt-1 text-blue-600 underline">Browse Image</span>
                                    </label>

                                    <input
                                        id="fileUpload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>}
                                    {selectedImage && (
                                        <ProfilePhotoCropper
                                            imageSrc={selectedImage}
                                            onCroppedBlobChange={(blob) => {
                                            setCroppedImage(blob); // will update automatically on every crop stop
                                            }}
                                        />
                                    )}
                            </div>}
                            {!changeImage && <div className='h-[280px] py-[18px] flex items-center justify-center'>
                                <img 
                                    className='w-[250px] h-[250px] rounded-[50%] object-cover' 
                                    src={userData?.profileUrl || "/images/placeholder.jpeg"} 
                                    alt='Person Image' 
                                />
                            </div>}
                        </div>
                        <div className="h-[100px] flex items-center input-shadow-upper px-[32px] gap-x-[16px]">
                            {!changeImage && <>
                                <button
                                    onClick={() => setChangeImage(true)}
                                    className={`cursor-pointer flex-1 h-[48px] font-bold text-[#3A3A3A] border border-[#CBCBCB] rounded-[24px] py-[13px] px-[24px]`}
                                >
                                Change
                                </button>
                            </>}
                            {changeImage &&  <button
                                onClick={() => {
                                    if (selectedImage && croppedImage) handleChangeImage();
                                }}
                                disabled={uploading || !selectedImage || !croppedImage}
                                className={`w-full h-[48px] font-bold text-[#FDFDFD] rounded-[24px] py-[13px] px-[24px] ${
                                    (selectedImage && croppedImage && !uploading)
                                    ? "bg-[#000000] cursor-pointer hover:bg-[#333333]"
                                    : "bg-[#CBCBCB] cursor-not-allowed"
                                }`}
                            >
                                {uploading ? "Uploading..." : "Proceed"}
                            </button>}
                        </div>
                    </div>
                </div>}
                <Navbar onSearchPage={false} expanded={true} />
                <div className="mt-[124px] flex items-center w-full border-y border-[#EDEDED] py-[24px] px-[40px] gap-x-[16px]">
                    <p className="font-bold text-[28px] text-[#222222]">Manage Account</p>
                </div>
                <div className="flex-1 grow flex w-full h-full" >
                    <div className='w-[25%] sidebar-shadow h-full'>
                        <div className='h-[150px] profile-info flex gap-x-[16px] items-center px-[40px]'>
                            <div onClick={() => setShowImageChange(true)} className='relative cursor-pointer'>
                                <img 
                                    className='w-[65px] h-[65px] rounded-[50%] object-cover' 
                                    src={userData?.profileUrl || "/images/placeholder.jpeg"} 
                                    alt="Profile Picture" 
                                />
                                <img className='absolute right-0 -bottom-[10px]' src="/images/Label.png" alt="Label" />
                            </div>
                            <div className='flex flex-col'>
                                <p className='font-bold text-[24px] text-[#FDFDFD]'>
                                    {userData?.firstName || ''} {userData?.lastName || ''}
                                </p>
                                <p className='font-medium text-[18px] text-[#FDFDFD]'>
                                    +91 {userData?.phoneNumber || ''}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className='h-full p-[32px]'>
                        <p className='font-medium text-[22px] text-[#222222]'>Personal Information</p>
                        <p className='text-[14px] text-[#3A3A3A]'>Manage and update your personal information here</p>
                        <div className='mt-[16px] flex flex-col'>
                            <div className='flex items-center h-[72px] px-[16px]'>
                                <p className='font-bold text-[14px] w-[200px] text-[#3A3A3A]'>Full Name</p>
                                <p className='font-medium text-[14px] w-[200px] text-[#3A3A3A]'>
                                    {userData?.firstName || ''} {userData?.lastName || ''}
                                </p>
                            </div>
                            <div className='flex items-center h-[72px] px-[16px]'>
                                <p className='font-bold text-[14px] w-[200px] text-[#3A3A3A]'>Phone Number</p>
                                <p className='font-medium text-[14px] w-[200px] text-[#3A3A3A]'>
                                    +91 {userData?.phoneNumber || ''}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Profile;