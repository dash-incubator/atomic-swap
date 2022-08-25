const sha256 = async (message: any): Promise<string> => {
    // Encode as UTF-8 -> Hash the message -> Convert ArrayBuffer to Array
    let msgBuffer = new TextEncoder().encode(message),
        hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer),
        hashArray = Array.from(new Uint8Array(hashBuffer));

    // Convert bytes to hex string
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};


export default { sha256 };
export { sha256 };
