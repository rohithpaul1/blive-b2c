import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Navbar from '../sections/Navbar';
import { UserContext } from '../contexts/UserContext';
import ProfilePhotoCropper from '../components/ProfilePhotoCropper';
import { postAPIMedia, getAPI } from '../caller/axiosUrls';
import toast from 'react-hot-toast';
import Login from '../components/Login';
import Loader from '../components/Loader';

const Profile = () => {
    const { userData, setUserData, isAuthenticated, loading, logout } = useContext(UserContext);
    const navigate = useNavigate();
    const fullName = `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim();
    const rawPhone = String(userData?.phoneNumber || '');
    const digits = rawPhone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    const phone = digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : rawPhone;
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
            <div className="w-full min-h-dvh overflow-x-hidden flex flex-col items-center md:h-dvh">
                {showImageChange && 
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center">
                    <div className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[20px] bg-white login-shadow md:max-h-[600px] md:w-[664px] md:rounded-[16px]">
                        {/* Header */}
                        <div className="flex items-center gap-x-[12px] px-[20px] py-[16px] header-shadow md:px-[32px] md:py-[24px]">
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
                                <p className="text-[20px] font-bold text-[#212121] md:text-[24px]">Update profile picture</p>
                                <p className='text-[14px] text-[#3A3A3A]'>A profile picture helps others recognise you easily</p>
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

                        <div className="flex flex-1 flex-col overflow-y-auto px-[20px] py-[16px] md:px-[32px]">
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
                        <div className="flex items-center gap-x-[12px] px-[20px] py-[16px] pb-[calc(16px+env(safe-area-inset-bottom,0px))] input-shadow-upper md:h-[100px] md:px-[32px] md:gap-x-[16px]">
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
                <div className="mt-[124px] flex w-full items-center gap-x-[16px] border-b border-[#EDEDED] px-[20px] py-[20px] md:border-t md:px-[40px] md:py-[24px]">
                    <h1 className="text-[24px] font-bold text-[#222222] md:text-[28px]">Manage account</h1>
                </div>
                <div className="flex w-full flex-1 flex-col md:h-full md:flex-row">
                    {/* Identity card: full-width on phones, sidebar from md up */}
                    <div className="px-[20px] pt-[20px] md:w-[300px] md:shrink-0 md:px-0 md:pt-0 md:sidebar-shadow md:h-full lg:w-[25%]">
                        <div className="profile-info flex items-center gap-x-[16px] rounded-[16px] px-[20px] py-[20px] md:h-[150px] md:rounded-none md:px-[32px] lg:px-[40px]">
                            <button type="button" aria-label="Change profile picture" onClick={() => setShowImageChange(true)} className="relative shrink-0 cursor-pointer">
                                <img
                                    className="h-[64px] w-[64px] rounded-[50%] object-cover"
                                    src={userData?.profileUrl || "/images/placeholder.jpeg"}
                                    alt=""
                                />
                                <img className="absolute right-0 -bottom-[10px]" src="/images/Label.png" alt="" />
                            </button>
                            <div className="flex min-w-0 flex-col">
                                <p className="truncate text-[20px] font-bold text-[#FDFDFD] md:text-[22px]">{fullName}</p>
                                <p className="text-[15px] font-medium text-[#FDFDFD]/90">{phone}</p>
                            </div>
                        </div>
                    </div>
                    <div className="min-w-0 flex-1 px-[20px] py-[24px] md:h-full md:p-[32px]">
                        <h2 className="text-[20px] font-semibold text-[#222222] md:text-[22px]">Personal information</h2>
                        <p className="mt-[4px] text-[15px] text-[#6a6a6a]">Manage and update your personal information here</p>
                        <dl className="mt-[12px] flex flex-col divide-y divide-[#ebebeb]">
                            <div className="flex flex-col gap-[2px] py-[14px] md:flex-row md:items-center md:gap-0 md:px-[16px] md:py-[24px]">
                                <dt className="text-[14px] font-semibold text-[#6a6a6a] md:w-[200px] md:text-[#3A3A3A]">Full name</dt>
                                <dd className="text-[16px] font-medium text-[#222222]">{fullName}</dd>
                            </div>
                            <div className="flex flex-col gap-[2px] py-[14px] md:flex-row md:items-center md:gap-0 md:px-[16px] md:py-[24px]">
                                <dt className="text-[14px] font-semibold text-[#6a6a6a] md:w-[200px] md:text-[#3A3A3A]">Phone number</dt>
                                <dd className="text-[16px] font-medium text-[#222222]">{phone}</dd>
                            </div>
                        </dl>

                        {/* Phone-only shortcuts, like Airbnb's profile tab */}
                        <ul className="mt-[24px] flex flex-col divide-y divide-[#ebebeb] border-y border-[#ebebeb] md:hidden">
                            {[
                                ["Notifications", "/notifications"],
                                ["My bookings", "/my-bookings"],
                                ["Wallet", "/wallet"],
                                ["Help Center", "/help-center"],
                            ].map(([label, to]) => (
                                <li key={to}>
                                    <button type="button" onClick={() => navigate(to)} className="flex min-h-[56px] w-full items-center justify-between text-left text-[16px] text-[#222222]">
                                        {label}
                                        <ChevronRight size={20} className="text-[#6a6a6a]" aria-hidden="true" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <button
                            type="button"
                            onClick={() => { logout(); navigate('/home'); }}
                            className="mt-[16px] min-h-[48px] text-[16px] font-semibold text-[#BE4907] underline underline-offset-4 md:hidden"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Profile;