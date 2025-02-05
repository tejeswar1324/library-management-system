let holdform = document.getElementById('holdform');
let book_id = document.getElementById('book_id');


holdform.onsubmit = () => {
    let body = {
        book_id : book_id.value
    }

    let url = '/user/holdBook';

    fetch(url,{
        method : "PUT",
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify(body),
        redirect:"follow"
    })
    .then((response) => {
        if(response.redirected){
            window.location.href = response.url;
        }
        console.log(response);
    })
    .catch((error) => {
        console.log(error);
    })
}