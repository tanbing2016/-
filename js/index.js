/**
 * Created by Administrator on 2016/11/30 0030.
 */
~(function(string){
    function queryParameter(){
        var obj={},
            reg=/([^?=&#]+)=([^?=&#]+)/g;
        this.replace(reg,function(){
            obj[arguments[1]]=arguments[2];
        })
        reg=/#([^?=&#]+)/;
        if(reg.test(this)){
            obj["HASH"]=reg.exec(this)[1];
        }
        return obj;
    }
    function formatTime(template){
        template=template||"{0}年{1}月{2}日 {3}时{4}分{5}秒"
        var ary=this.match(/\d+/g);
        template=template.replace(/\{(\d+)\}/g,function(){
            var index=arguments[1],
                result=ary[index];
            result=result||"00";
            result.length<2 ? result="0"+result:null;
            return result;
        })
        return template
    }
    string.queryURLParameter=queryParameter;
    string.formatTime=formatTime;
})(String.prototype);
~(function(){
    function fn(){
        var winH=document.documentElement.clientHeight||document.body.clientHeight;
        var $mainContent=$(".main-content"),
            $menu=$mainContent.children("#menu"),
            $right=$("#right"),
            $news=$right.children(".news");
        var tarH=winH-64-40,
            newsH=winH-64-82-60;
        $news.css("height",newsH);
        $mainContent.css("height",tarH);
        $menu.css("height",tarH-2);
    }
    fn();
    $(window).on("resize",fn);
    window.isRun=true;
})();
var menuRender=(function(){
    var $menu=$("#menu"),
        menuExample=null,
        $links=$menu.find("a");
    var $menuPlan=$.Callbacks();
    $menuPlan.add(function(){
        menuExample=new IScroll("#menu",{
            scrollbars:true,
            mouseWheel:true,
            click:true,
            bounce:false,
            fadeScrollbars:true
        })
    })
    $menuPlan.add(function(){
        var hash=window.location.href.queryURLParameter()["HASH"];
        var $tar=$links.filter("[href='#"+hash+"']");
        $tar.length===0 ? $tar=$links.eq(0):null;
        $tar.parent().addClass("select");
        menuExample.scrollToElement($tar[0],500);

        //////
        calendarRendar.init($tar.attr("data-id"));
    })
    $menuPlan.add(function(){
        $links.on("click",function(){
            var that=this;
            $links.each(function(index,item){
                that===item ? $(item).parent().addClass("select"):$(item).parent().removeClass("select");
            })
            calendarRendar.init($(this).attr("data-id"));
        })
    })
    return {
        init:function(){
            $menuPlan.fire();
        }
    }
})();
var calendarRendar=(function(){
    var $topPlan=$.Callbacks(),
        $top=$("#top"),
        $wrapper=$top.children(".wrapper"),
        $item=$top.find(".item"),
        $links=null,
        $btn=$top.children(".btn");
    var minL=0,maxL=0;
    $topPlan.add(function(columnId,today,data){
        var str="";
        $.each(data,function(index,cur){
            str+="<li><a href='javascript:void 0' data-time='"+cur.date+"'>";
            str+="<span class='week'>"+cur.weekday+"</span>";
            str+="<span class='date'>"+cur.date.formatTime("{1}-{2}")+"</span>";
            str+="</a></li>"
        })
        $item.html(str).css("width",data.length*110);
        $links=$item.find("a");
        minL=(data.length-7)*-110;
    })
    $topPlan.add(function(columnId,today,data){
        var $tar=$links.filter("[data-time='"+today+"']");
        if($tar.length===0){
            var todayTime=today.replace(/-/g,"");
            $links.each(function(index,curLink){
                var curTime=$(curLink).attr("data-time").replace(/-/g,"");
                if(curTime>todayTime){
                    $tar=$(curLink);
                    return false;
                }
            });
        }else{
            $tar.find(".week").html("今天");
        }
            $tar.length=== 0 ? $tar=$links.eq($links.length-1):null;
            $tar.addClass("bg");
            var parIndex=$tar.parent().index(),
                tarL=parIndex*-110+330;
            tarL=tarL<minL ? minL : (tarL>maxL ? maxL:tarL);
            $item.css("left",tarL);
            var strIn=Math.abs(tarL/110),
                endIn=strIn+6;
            var strTime=$links.eq(strIn).attr("data-time"),
                endTime=$links.eq(endIn).attr("data-time");
            newsRender.init(columnId,strTime,endTime);
    });
    $topPlan.add(function(columnId,today,data){
        $btn.on("click",function(){
            window.isRun=true;
            $links.removeClass("bg");
            var curL=parseFloat($item.css("left"));
            curL%110!==0? curL=Math.round(curL/110)*110:null;
            $(this).hasClass("btnLeft") ? curL+=770:curL-=770;
            curL= curL > maxL ? maxL : (curL<minL ? minL:curL);
            $item.stop().animate({left:curL},300,function(){
                var strIn=Math.abs(curL/110),
                    endIn=strIn+6;
                var strTime=$links.eq(strIn).attr("data-time"),
                    endTime=$links.eq(endIn).attr("data-time");
                $links.eq(strIn).addClass("bg").parent().siblings().removeClass("bg");
            })
            var strIn=Math.abs(curL/110),
                endIn=strIn+6;
            var strTime=$links.eq(strIn).attr("data-time"),
                endTime=$links.eq(endIn).attr("data-time");
            newsRender.init(columnId,strTime,endTime);
        })
        $links.on("click",function(){
            window.isRun=false;
                $links.removeClass("bg");
                $(this).addClass("bg");
                //////////////////////////////////////////////////////////
                var curL=parseFloat($item.css("left"));
                var strIn=Math.abs(curL/110),
                    endIn=strIn+6;
                var strTime=$links.eq(strIn).attr("data-time"),
                    endTime=$links.eq(endIn).attr("data-time");
                newsRender.init(columnId,strTime,endTime,this);
        })

    });
    return {
        init:function(columnId){
            $.ajax({
                url:"http://matchweb.sports.qq.com/kbs/calendar?columnId="+columnId,
                type:"get",
                dataType:"jsonp",
                success:function(result){
                    if(result&&result.code===0){
                        result=result["data"];
                        var today=result["today"],
                            data=result["data"];
                        $topPlan.fire(columnId,today,data);
                    }
                }
            })
        }
    }
})();
var newsRender=(function(){
    var $newsPlan=$.Callbacks(),
        $right=$("#right"),
        $news=$right.children(".news"),
        $video=$news.children(".video"),
        newsExample=null,
        $links=null;

    //获取信息
    $newsPlan.add(function(result){
        var str="",strInner="";
        if(window.isRun==true){
            $.each(result,function(index,cur){
                str+="<div class='video-date' curData-time='"+index.formatTime('{1}-{2}')+"'>"+index.formatTime("{1}月{2}日")+"</div>";
                $.each(cur,function(index,curItem){
                    str+="<a href='javascript: void 0'>";
                    str+="<ul class='inner'>";
                    str+="<li class='newsItem1' isPay='"+curItem.isPay+"'>"+curItem.startTime.formatTime("{3}:{4}")+"<i></i></li>";
                    str+="<li class='newsItem2'>"+curItem.matchDesc+"</li>";
                    str+="<li class='newsItem3'><img src='"+curItem.leftBadge+"'><span>"+curItem.leftName+"</span></li>";
                    str+="<li class='newsItem4'>"+curItem.leftGoal+"-"+curItem.rightGoal+"</li>";
                    str+="<li class='newsItem5 clear'><span>"+curItem.rightName+"</span><img src='"+curItem.rightBadge+"'></li>";
                    str+="<li class='newsItem6'><span>视频锦集</span><span>精彩回放</span></li>";
                    str+="</ul>";
                    str+="</a>";
                })
            })
            $video.html(str);
            var $isPay=$video.find("li").filter("[isPay=0]");
            $isPay.find("i").css("display","none");
        }
    })
    $newsPlan.add(function(){
        var $scroll=$news.children(".iScrollVerticalScrollbar");
        if($scroll.length<1){
            newsExample=new IScroll(".news",{
                scrollbars:true,
                mouseWheel:true,
                click:true,
                bounce:false,
                fadeScrollbars:true
            })
        }
            var $curA=$(".item").find("a");
            var $curD=$curA.filter("[class='bg']");
            var text=$curD.find(".date").html();
            var $div=$video.find("div");
            $.each($div,function(index,item){
                var curDate=$(item).attr("curData-time");
                if(text==curDate){
                    newsExample.scrollToElement(item,1000);
                    window.curItem=$video.parent().css("top")
                }
            })
    });
    return {
        init:function(columnId,strTime,endTime,that){
            $.ajax({
                url:"http://matchweb.sports.qq.com/kbs/list?columnId="+columnId+"&startTime="+strTime+"&endTime="+endTime+"",
                type:"get",
                dataType:"jsonp",
                success:function(result){
                   if(result&&result.code===0){
                       var result=result["data"];
                       $newsPlan.fire(result,that);
                   }
                }
            })
        }
    }
})()
menuRender.init();