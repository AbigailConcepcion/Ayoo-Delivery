/**
 * Avatar Utility Functions
 * Provides functions to generate and manage user avatars
 */

/**
 * Get initials from a name (first letter of first two words)
 * @param name - The user's full name
 * @returns Uppercase initials (max 2 characters)
 */
export const getInitials = (name: string): string => {
    if (!name || name.trim() === '') return '?';

    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
        return words[0].charAt(0).toUpperCase();
    }

    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
};

/**
 * Generate a consistent color based on the user's email
 * @param email - The user's email address
 * @returns A color hex code
 */
const getColorFromEmail = (email: string): string => {
    const colors = [
        '#FF1493', // Pink
        '#7B2FF7', // Purple
        '#3B82F6', // Blue
        '#10B981', // Green
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#06B6D4', // Cyan
        '#8B5CF6', // Violet
        '#EC4899', // Fuchsia
        '#14B8A6', // Teal
    ];

    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
};

/**
 * Generate an avatar URL using UI Avatars API with initials
 * @param name - The user's name
 * @param email - The user's email (for consistent color)
 * @param size - The avatar size in pixels
 * @returns A URL to the generated avatar
 */
export const generateAvatar = (name: string, email: string, size: number = 150): string => {
    const initials = getInitials(name);
    const backgroundColor = getColorFromEmail(email);
    const textColor = 'FFFFFF';

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${backgroundColor.slice(1)}&color=${textColor}&size=${size}&bold=true&font-size=0.4&length=2`;
};

/**
 * Generate a data URL for a simple initials avatar (fallback when no internet)
 * @param name - The user's name
 * @param email - The user's email (for consistent color)
 * @returns A data URL containing an SVG with initials
 */
export const generateAvatarDataUrl = (name: string, email: string): string => {
    const initials = getInitials(name);
    const backgroundColor = getColorFromEmail(email);

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
      <rect width="150" height="150" fill="${backgroundColor}"/>
      <text x="50%" y="50%" dy=".35em" fill="white" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${initials}</text>
    </svg>
  `.trim();

    return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Check if a string is a valid avatar URL
 * @param avatar - The avatar string to check
 * @returns True if it's a valid URL or data URL
 */
export const isValidAvatar = (avatar: string | undefined): boolean => {
    if (!avatar || avatar.trim() === '') return false;
    const trimmedAvatar = avatar.trim();
    return trimmedAvatar.startsWith('http') || trimmedAvatar.startsWith('data:') || trimmedAvatar.startsWith('blob:');
};

/**
 * Get the best avatar to display
 * @param avatar - The user's stored avatar
 * @param name - The user's name
 * @param email - The user's email
 * @returns The avatar URL to display
 */
export const getDisplayAvatar = (
    avatar: string | undefined,
    name: string,
    email: string
): string => {
    if (isValidAvatar(avatar)) {
        return avatar!;
    }
    // Generate a new avatar if none exists
    return generateAvatar(name, email);
};

