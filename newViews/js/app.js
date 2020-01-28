$(document).ready(function(){

    // Here we put all the code
    var heart = $('.heart'),
        cog = $('#cog'),
        popUp = $('.popUp'),
        closePopUp = $('#closePopUp'),
        cancelPopUp = $('#cancelPopUp');

    heart.click(function(){
        $(this).toggleClass('fa-heart-o');
        $(this).toggleClass('heart-red fa-heart');
    })

    cog.click(function(){
        popUp.fadeIn(500);
    })

    closePopUp.click(function(){
        popUp.fadeOut(500);
    })

    cancelPopUp.click(function(){
        popUp.slideUp(500)
    })
    // jquery of explore file
    // $('.people__person').click(function(){
    //     console.log($(this).find('.people__username').html())
    // })

    $('.follow').click(function(){
        var username = $(this).parents('.people__person').find('.people__username').html()
        $.post('/follow',{username:username},function(data){
            // if(data==='done')
            console.log(data)
        })
        $(this).html('Following')
    })

    //image-detail
    $('.profile-picture__overlay').click(function(){
        var img_path = $(this).siblings(".profile-picture__picture").attr("src");
        // var img_path = $(this).parents('progile-picture').find('profile-picture__picture').attr("src");
        console.log(img_path);
        $.post('/image-detail', {img_path:img_path}, function(data){
            
        });
        console.log('after post')
    })


    //like
function update()
{    
    // var img = $('.fa-lg.fa-heart-o').parents('.photo').find('.photo__file').attr("src");

    //     var username = $('.fa-lg.fa-heart-o').parents('.photo').find('.photo__username').html();
    //     // console.log(username)
    // $.post('/like',{img_path:img, username:username},function(data,status){
        // console.log(this);
        $('.fa-lg.fa-heart-o').parents('.photo').find('.photo__likes').html(""); 
    // });
    // console.log($(img))
    // $.post('/addComment',{img_path:img, username:username},function(data,status){
    //     // console.log(this);
    //     $('.fa-lg.fa-heart-o').parents('.photo').find('.photo__comments').html(data.no_of_comments); 
    // });
}

update()

// like
    $('.fa-heart-o').bind('click',function(){
        
        // $('fa-heart-o').style.pointerEvents= 'none'
        var img = $(this).parents('.photo').find('.photo__file').attr("src");
        var username = $(this).parents('.photo').find('.photo__username').html();
        var selector = $(this);
        
        $.post('/like',{img_path:img, username:username},function(data,status){
            // console.log(this);
            selector.parents('.photo').find('.photo__likes').html(data.likes); 
        });
        $(this).unbind('click');
    });
    
    //addcomments
    $('.fa-ellipsis-h').click(function(){
        var img = $(this).parents('.photo').find('.photo__file').attr("src");
        var username = $(this).parents('.photo').find('.photo__username').html();
        var comment = $(this).parents('.photo').find('.photo__add-comment').val();
        var selector = $(this);
        
        $(this).parents('.photo').find('.photo__add-comment').val("");
        $.post('/addComment',{img_path:img, username:username, comment:comment},function(data,status){
            
            // console.log(data)

            var json= JSON.stringify(data)
            json2 = JSON.parse(json)
            var last = json2.length
            // console.log(json2[1].commentBy)
            
            for(var i = last-1; i>= last-1; --i)
            {
                selector.parents('.photo').find('.photo__comments').append(`<li class=\"photo__comment\"><span class=\"photo__comment-author\">${json2[i].commentBy}</span>${json2[i].comment}</li>`)
            }
            
            
        });
    });

    //view comments
    $('.fa.fa-comment-o.fa-lg').click(function(){
        var img = $(this).parents('.photo').find('.photo__file').attr("src");
        var username = $(this).parents('.photo').find('.photo__username').html();
        var selector = $(this);
        
        
        $.post('/comments',{img_path:img, username:username},function(data,status){
            
            // console.log(data)
            if(data)
            {
                var json= JSON.stringify(data)
                json2 = JSON.parse(json)
                var last = json2.length
                // console.log(json2[2])
                selector.parents('.photo').find('ul.photo__comments').empty();
                for(var i = last-1; i>=0 ; --i)
                {
                    console.log(json2[i])
                    
                    selector.parents('.photo').find('.photo__comments').append(`<li class=\"photo__comment\"><span class=\"photo__comment-author\">${json2[i].commentBy}</span>${json2[i].comment}</li>`)
                }

                // console.log(this);
            }    // selector.parents('.photo').find('.photo__comments').html(data.no_of_comments); 
        });
    });

    //stalking
    $('.people__username').click(function(){
        // var username = $(this).find('.people__username').html();
        var username = $(this).html()
        console.log(username)
        $.post('/stalk', {username:username},function(data){
            console.log(JSON.stringify(data))

            // $('document').html(JSON.stringify(data))
            // if(data)
            // {
            //     $.get(('/go'),function(data){
            //         window.location.href = "/go";
            //     })
            // }

        })
    })

})