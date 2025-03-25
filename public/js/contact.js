// vise svar når man trykker på spørsmålet

// .addEventListener("mouseover")

function toggleFaqQuestions(faqAnswerID)
{
    // store the DOM element in a variable
    let faqAnswer = document.getElementById(faqAnswerID);
    // toggle the class faq-answer-visible
    faqAnswer.classList.toggle("faq-answer-visible");

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