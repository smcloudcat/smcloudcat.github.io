var path = decodeURIComponent(location.hash.substr(2));
var page = 1;

if (location.search.substr(1, 19) == '_escaped_fragment_=') {
    path = decodeURIComponent(location.search.substr(20).split('&')[0]);
}

if (path == '/') {
    path = '';
    window.history.replaceState(null, '', '/');
    page = 1;
} else if (path && !location.search) {
    window.history.replaceState(null, '', (isroot ? '' : ('/' + repos)) + '/#!/' + path);
}

var converter = new Showdown.converter();
var content = document.getElementById('content');
var loading = document.getElementById('loading');
var backhome = document.getElementById('backhome');
var xmlhttp;
var kw;
var postList;
var pending;
var commentscount = [];
var isroot = (repos.indexOf('github.com') == -1 && repos.indexOf('github.io') == -1 ? false : true);

main();

function main() {
    var disqusCounts = document.getElementsByName('commentscount');
    for (var i = 0; i < disqusCounts.length; i++) {
        commentscount[Number(disqusCounts[i].id.substr(5))] = disqusCounts[i].innerText;
    }
    content.innerHTML = '';
    loading.style.display = 'block';
    if (path.split('/')[1] == 'search') {
        search(path.split('/')[2]);
    } else if (path && path.split('/')[1] != 'page') {
        showpost(path);
    } else {
        document.title = sitetitle;
        if (postList) {
            showlist(postList);
        } else {
            pending = true;
            document.getElementById('takinglonger').style.display = 'none';
            chktakinglonger();
            var el = document.createElement('script');
            el.src = 'https://proxy.hancat.work/hancat/https/api.github.com/repos/' + githubname + '/' + repos + '/contents/md?callback=showlist' + (branch ? ('&ref=' + branch) : '');
            document.getElementsByTagName('head')[0].appendChild(el);
        }
    }
}

function home() {
    path = '';
    if (page == 1) {
        window.history.pushState(null, '', (isroot ? '' : ('/' + repos)) + '/');
    } else {
        path = '/page/' + page;
        window.history.pushState(null, '', (isroot ? '' : ('/' + repos)) + '/#!/page/' + page);
    }
    main();
}

function lowerCase(path) {
    path = path.split('%');
    var newPath = path[0];
    for (var i = 1; i < path.length; i++) {
        newPath += '%' + path[i].substr(0, 2).toLowerCase() + path[i].substr(2);
    }
    return newPath;
}

function loadXMLDoc(url) {
    xmlhttp = new XMLHttpRequest();
    if (xmlhttp != null) {
        pending = true;
        document.getElementById('takinglonger').style.display = 'none';
        chktakinglonger();
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4) { // 4 = "loaded"
                pending = false;
                document.getElementById('takinglonger').style.display = 'none';
                loading.style.display = 'none';
                if (xmlhttp.status == 200) { // 200 = "OK"
                    var blog_text = xmlhttp.responseText;
                    var encoded = false;
                    if (blog_text.substr(0, 2) == '::') {
                        blog_text = Base64.decode(blog_text.substr(2));
                        encoded = true;
                    }
                    blog_text = filterJekyllHeader(blog_text);
                    content.innerHTML = '<div id="content_inner"><div id="back_home"><a href="/" onclick="home();return false;">' + sitetitle + '</a><span>&nbsp;›&nbsp;</span></div><br><blockquote class="layui-elem-quote"><h2 id="post_title">' + decodeUtf8(getPostName(path)) + (encoded ? Base64.decode('PHN1cCBzdHlsZT0iZm9udC1zaXplOjAuNWVtO3ZlcnRpY2FsLWFsaWduOiBzdXBlcjsiIHRpdGxlPSLmraTmlofnq6Dlt7Looqvph43mlrDnvJbnoIHku6XourLpgb/lrqHmn6UiPuKYmuiiq+e8lueggeeahOWGheWuuTwvc3VwPg==') : '') + '</h2><div class="date">' + pdate + '</div></blockquote><div id="sidebar" class="layui-col-md15">  ' + converter.makeHtml(blog_text) + '</div></div>';
                } else if (xmlhttp.status == 404) {
                    document.title = 'Not Found - ' + sitetitle;
                    content.innerHTML = '<img src="images/despicable_me.png" />';
                } else {
                    document.title = 'Technology Problem - ' + sitetitle;
                    content.innerHTML = '<div id="takinglonger"><blockquote>We meet a problem when try to handle ' + path + ' (Err: ' + xmlhttp.status + ').</blockquote></div>';
                }
            }
        }
        xmlhttp.open("GET", url, true);
        xmlhttp.send(null);
    }
}

function chktakinglonger() {
    setTimeout(function () {
        if (pending) {
            document.getElementById('takinglonger').style.display = 'block';
        }
    }, 10000);
}

function showpost(path) {
    var url = location.protocol + '//' + location.hostname + (isroot ? '' : ('/' + repos)) + '/md/' + path.substr(1).replace(/\//g, '-') + (suffix ? suffix : '');
    document.title = decodeUtf8(getPostName(path)) + ' - ' + sitetitle;
    pdate = path.substr(1).split('/').join('-');
    loadXMLDoc(url);
}

function showlist(list) {
    if (path.split('/')[1] == 'page') {
        page = Number(path.split('/')[2]);
        if (isNaN(page) || page < 1) {
            page = 1;
        }
        if (page == 1) {
            window.history.replaceState(null, '', (isroot ? '' : ('/' + repos)) + '/');
        }
    }
    pending = false;
    document.getElementById('takinglonger').style.display = 'none';
    postList = list;
    var txt = '';
    if (page * 20 - 20 >= list.data.length && page != 1) {
        page = Math.ceil(list.data.length / 20);
        window.history.replaceState(null, '', (isroot ? '' : ('/' + repos)) + '/#!/page/' + page);
    }
    for (var i = list.data.length - (page - 1) * 20; i > 0 && i > list.data.length - page * 20; i--) {
        if (suffix && list.data[i - 1].name.substr(-suffix.length) == suffix) {
            list.data[i - 1].name = list.data[i - 1].name.substr(0, list.data[i - 1].name.length - suffix.length);
        }
        txt += '<blockquote class="layui-elem-quote"><postlist><a href="' + (isroot ? '' : ('/' + repos)) + '/#!/' + encodePath(list.data[i - 1].name, true) + '">' + getPostName(list.data[i - 1].name) + '</a><div class="post_info"><span class="post_date">' + list.data[i - 1].name.split('-')[0] + '-' + list.data[i - 1].name.split('-')[1] + '-' + list.data[i - 1].name.split('-')[2] + '</span></div></postlist></blockquote>';
    }
    if (page == 1 && page * 20 < list.data.length) {
        txt += '<postlist><a class="prev_page" href="' + (isroot ? '' : ('/' + repos)) + '/#!/page/' + (page + 1) + '">←较早的文章</a><div style="clear:both"></div></postlist>';
    } else if (page > 1 && page * 20 >= list.data.length) {
        txt += '<postlist><a class="next_page" href="' + (isroot ? '' : ('/' + repos)) + '/#!/page/' + (page - 1) + '">较新的文章→</a><div style="clear:both"></div></postlist>';
    } else if (page > 1 && page * 20 < list.data.length) {
        txt += '<postlist><a class="prev_page" href="' + (isroot ? '' : ('/' + repos)) + '/#!/page/' + (page + 1) + '">←较早的文章</a><a class="next_page" href="' + (isroot ? '' : ('/' + repos)) + '/#!/page/' + (page - 1) + '">较新的文章→</a><div style="clear:both"></div></postlist>';
    }
    content.innerHTML = '<div id="content_inner"><div id="back_home"><a href="/" onclick="home();return false;">' + sitetitle + '</a><span>&nbsp;›&nbsp;</span></div><div id="posts">' + txt + '</div></div>';
    loading.style.display = 'none';
}

function encodePath(path, isName) {
    var ret = encodeURIComponent(path);
    if (!isName) {
        ret = ret.replace(/%2F/g, '/');
    }
    return ret;
}

function getPostName(path) {
    return path.split('/').pop().replace(/-/g, ' ').replace(/\d{4}/, function (m) { return m + '年'; }).replace(/\d{2}/, function (m) { return m + '月'; }).replace(/\d{2}/, function (m) { return m + '日'; });
}

function filterJekyllHeader(text) {
    return text.replace(/^---[\s\S]*?---\s*/, '');
}

function decodeUtf8(text) {
    try {
        return decodeURIComponent(escape(text));
    } catch (e) {
        console.error("Error decoding URI component:", e);
        return text;
    }
}

function search(keyword) {
    kw = keyword;
    document.title = sitetitle + ' - 搜索结果';
    var url = 'https://proxy.hancat.work/hancat/https/api.github.com/search/code?q=' + encodeURIComponent(keyword) + '+repo:' + githubname + '/' + repos + '&callback=searchCallback';
    var script = document.createElement('script');
    script.src = url;
    document.getElementsByTagName('head')[0].appendChild(script);
}

function searchCallback(result) {
    if (result.data.items.length > 0) {
        var txt = '<div id="content_inner"><div id="back_home"><a href="/" onclick="home();return false;">' + sitetitle + '</a><span>&nbsp;›&nbsp;</span></div><div id="search_results">';
        for (var i = 0; i < result.data.items.length; i++) {
            txt += '<blockquote class="layui-elem-quote"><a href="' + (isroot ? '' : ('/' + repos)) + '/#!/' + encodePath(result.data.items[i].path) + '">' + result.data.items[i].path + '</a><div class="search_result">' + result.data.items[i].name + '</div></blockquote>';
        }
        txt += '</div></div>';
        content.innerHTML = txt;
        loading.style.display = 'none';
    } else {
        content.innerHTML = '<div id="content_inner"><div id="back_home"><a href="/" onclick="home();return false;">' + sitetitle + '</a><span>&nbsp;›&nbsp;</span></div><div id="search_results"><p>没有找到匹配的结果。</p></div></div>';
        loading.style.display = 'none';
    }
}
