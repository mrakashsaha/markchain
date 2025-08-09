export function generateRandomPassword(length = 12) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array); // secure random values
    return Array.from(array, num => chars[num % chars.length]).join('');
}