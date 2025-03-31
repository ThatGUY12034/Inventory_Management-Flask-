// Hide flash messages after 2 seconds
$(document).ready(function(){
    setTimeout(function(){
        $(".alert").fadeOut("slow");
    }, 2000);
});

// Prevent form autofill
$(document).ready(function(){
    $("form").attr("autocomplete", "off");
});

// Form validation before submitting
$(document).ready(function(){
    $("form").submit(function(event){
        let username = $("input[name='name']").val().trim();
        let password = $("input[name='password']").val().trim();

        if(username === "" || password === ""){
            alert("Please fill in all fields.");
            event.preventDefault();
        }
    });
});
