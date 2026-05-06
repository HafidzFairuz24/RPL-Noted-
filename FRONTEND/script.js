document.addEventListener("DOMContentLoaded", () => {
    const navButtons = document.querySelectorAll(".nav-btn");

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            navButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            
            
        });
    });

  
    const cards = document.querySelectorAll(".workspace-card");
    cards.forEach(card => {
        card.addEventListener("click", () => {
            card.style.transform = "scale(0.95)";
            setTimeout(() => {
                card.style.transform = "translateY(-5px)"; 
            }, 150);
        });
    });
});