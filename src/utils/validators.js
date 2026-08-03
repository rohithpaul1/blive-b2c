const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
}

const isValidPanCard = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
};

const isValidAadharNumber = (aadhar) => {
    const aadharRegex = /^[2-9]{1}[0-9]{11}$/;
    return aadharRegex.test(aadhar);
};

export { isValidEmail, isValidPhoneNumber, isValidAadharNumber, isValidPanCard };