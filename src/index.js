import "./normalize.css"
import "./styles.css"
import Chart from 'chart.js/auto';
import Muted from "./assets/images/muted.png"
import Unmuted from "./assets/images/unmuted.png"
import ChartDataLabels from 'chartjs-plugin-datalabels';

/**COUNTUP ANIMATION */
document.addEventListener("DOMContentLoaded", function() {
    const countupElement = document.getElementById("countup");
    const target = 34; // The final value to count up to
    const duration = 2500; // Duration of the count-up animation in milliseconds (1 second)
    let start = null; // Timestamp when the animation starts, initialized to null

    // Easing function for ease-out effect
    // This function creates an ease-out effect, where the animation starts fast and slows down toward the end
    function easeOutQuad(t) {
        return t * (2 - t);
    }

    // The function that performs the count-up animation
    function countUp(timestamp) {
        if (!start) start = timestamp; // Set the start time if it's not set yet
        const progress = Math.min((timestamp - start) / duration, 1); // Calculate the progress from 0 to 1
        const easedProgress = easeOutQuad(progress); // Apply the easing function to the progress
        countupElement.textContent = Math.floor(easedProgress * target); // Update the displayed count based on progress

        if (progress < 1) {
            // If the animation is not yet complete, request the next animation frame
            requestAnimationFrame(countUp);
        } else {
            // When the animation is complete, set the final value with the label
            countupElement.textContent = target;
        }
    }

    // Start the animation by requesting the first animation frame
    requestAnimationFrame(countUp);
});


/**GRAFICO A TORTA */
const ctx = document.getElementById('choirChart').getContext('2d');
const choirChart = new Chart(ctx, {
    type: 'pie',
    data: {
        labels: ['Bassi', 'Tenori', 'Contralti', 'Soprani'],
        datasets: [{
            label: 'Totale',
            data: [7, 6, 14, 7],
            backgroundColor: [
                '#e43b3bff', // Bass
                '#568ea3ff', // Tenors
                '#5fb75f', // Altos
                '#dba159ff'  // Sopranos
            ],
            borderColor: '#ffffff',
            borderWidth: 2
        }]
    },
    options: {
        responsive: true,
        animation: {
            duration: 1000,
            easing: 'easeOutQuad',
            animateScale: true
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 20,
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    color: '#333',
                    padding: 15,
                    usePointStyle: true
                }
            },
            tooltip: {
                enabled: true
            },
            datalabels: {
                color: '#000',
                formatter: (value) => {
                    return value;
                },
                anchor: 'center',
                align: 'center',
                offset: 0,
                borderRadius: 5,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 1,
                borderColor: '#ccc'
            }
        }
    }
});

/**APPEARING TEXT ANIMATION "IL CONTROCORO È..." */
document.addEventListener("DOMContentLoaded", function() {
    const phrases = [
        "il coro di Spin Time Labs.",
        "aperto a tuttə.",
        "per musicisti e no.",
        "di sinistra.",
        "divertente ed economico.",
        "inclusivo.",
    ];

    const textElement = document.getElementById("controcoroText");
    let currentPhraseIndex = 0;
    const animationDuration = 3500; // Duration for each phrase in milliseconds (5 seconds)

    // Function to display the next phrase with a typewriter animation
    function typePhrase(phrase) {
        textElement.innerHTML = ""; // Clear existing text
        let charIndex = 0;

        function typeNextChar() {
            if (charIndex < phrase.length) {
                textElement.innerHTML += phrase[charIndex].replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                charIndex++;
                setTimeout(typeNextChar, 100); // Set delay for typing next character
            }
        }
        typeNextChar();
    }

    // Function to change to the next phrase
    function changePhrase() {
        currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
        typePhrase(phrases[currentPhraseIndex]);
    }

    // Start the typewriter animation for the initial phrase
    typePhrase(phrases[currentPhraseIndex]);

    // Set interval to change the phrase every 5 seconds
    setInterval(changePhrase, animationDuration);
});

document.addEventListener("DOMContentLoaded", function() {
    const sections = document.querySelectorAll(".fadein");
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 1.0
    });

    sections.forEach(section => {
        observer.observe(section);
    });
});

/**TOGGLE MUTE VIDEO */
document.getElementById("unmuteButton").addEventListener("click", function() {
    const muted = "<img src='https://raw.githubusercontent.com/niccostantini/controcoro-landing-page/refs/heads/main/src/assets/images/muted.png'>";
    const unmuted = "<img src='https://raw.githubusercontent.com/niccostantini/controcoro-landing-page/refs/heads/main/src/assets/images/unmuted.png'>";
    const video = document.getElementById("backgroundVideo");
    if (video.muted) {
        video.muted = !video.muted;
        this.innerHTML = unmuted;
    } else {
        video.muted = !video.muted;
        this.innerHTML = muted;
    }
});