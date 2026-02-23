import { baseLayout } from './baseLayout';

export const reviewRequestTemplate = (data: {
    customerName: string;
}) => {
    const subject = 'Thank you for dining at Diba 🌿';
    const reviewUrl = 'https://g.page/r/diba-restaurant-montreal/review';

    const html = baseLayout(`
    <h2>Salam ${data.customerName},</h2>
    <p>We hope you had a wonderful evening with us at Diba. It was truly a pleasure to serve you.</p>
    
    <p>Good food, good company, and great memories are what we strive for. We hope our flavors brought you a taste of Persia.</p>
    
    <p>If you enjoyed your experience, would you mind sharing it with others? Your feedback helps our small family business grow and serves as a great encouragement to our team.</p>
    
    <a href="${reviewUrl}" class="btn">Share Your Experience</a>
    
    <p>Thank you for your hospitality and for choosing Diba. We hope to see you again soon!</p>
    
    <p>Be omid-e didar (Until we meet again),</p>
    <p><strong>The Diba Family</strong></p>
  `);

    return { subject, html };
};
