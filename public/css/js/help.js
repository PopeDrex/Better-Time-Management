// vise svar når man trykker på spørsmålet

// .addEventListener("mouseover")

function toggleFaqQuestions(faqAnswerID)
{
    // store the DOM element in a variable
    let faqAnswer = document.getElementById(faqAnswerID);
    // toggle the class faq-answer-visible
    //faqAnswer.classList.toggle("faq-answer-visible");

    // another way to do the same thing
    /*if (faqAnswer.style.display === "block")
    {
        faqAnswer.style.display = "none";
    }
    else
    {
        faqAnswer.style.display = "block";
    }*/
}

// Variable holding original grid-template-columns property
let gridTemplateProperty = "";
/// TODO: need to implement animation for transition to contact form
function showContactForm() {
    let contactForm = document.getElementById("contact-form-hidden");
    contactForm.style.display = "block";

    let contactText = document.getElementById("contact-form-normal");
    contactText.style.display = "none";

    let featureGrid = document.getElementById("contact-grid");
    gridTemplateProperty = featureGrid.style.getPropertyValue("grid-template-columns");
    featureGrid.style.setProperty("grid-template-columns", "repeat(auto-fit, minmax(100%, 1fr))");
    
    return false;
}
/// TODO: need to implement animation for transition back from contact form
function hideContactForm() {
    let contactForm = document.getElementById("contact-form-hidden");
    contactForm.style.display = "none";
    let contactText = document.getElementById("contact-form-normal");
    contactText.style.display = "block";
    let featureGrid = document.getElementById("contact-grid");
    featureGrid.style.setProperty("grid-template-columns", gridTemplateProperty);

    return false;
}