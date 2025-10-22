document.addEventListener("DOMContentLoaded", function() {

    // --- Intersection Observer for "Fade-in" Animation ---
    
    // Find all elements with the .fade-in class
    const targets = document.querySelectorAll('.fade-in');

    // Set up the observer options
    const options = {
        root: null, // observes intersections relative to the viewport
        rootMargin: '0px',
        threshold: 0.1 // 10% of the element must be visible
    };

    // Create the observer callback function
    const callback = (entries, observer) => {
        entries.forEach(entry => {
            // If the element is intersecting (visible)
            if (entry.isIntersecting) {
                // Add the 'is-visible' class
                entry.target.classList.add('is-visible');
                // Stop observing this element since it's already visible
                observer.unobserve(entry.target);
            }
        });
    };

    // Create the observer
    const observer = new IntersectionObserver(callback, options);

    // Observe each target element
    targets.forEach(target => {
        observer.observe(target);
    });

});