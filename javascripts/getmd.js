(function () {
    const path = decodeURIComponent(location.hash.slice(2)) || '';
    let page = 1;
    const content = document.getElementById('content');
    const dis = document.getElementById('disqus_thread');
    const loading = document.getElementById('loading');
    const backhome = document.getElementById('backhome');
    let postList, pending, disqus_url, pdate;
    const commentscount = [];
    const isRoot = repos.includes('github.com') || repos.includes('github.io');

    if (location.search.startsWith('?escaped_fragment_=')) {
        path = decodeURIComponent(location.search.slice(20).split('&')[0]);
    }

    if (path === '/') {
        window.history.replaceState(null, '', '/');
        page = 1;
    } else if (path && !location.search) {
        window.history.replaceState(null, '', `${isRoot ? '' : `/${repos}`}#!${path}`);
    }

    document.addEventListener('DOMContentLoaded', main);
    window.onhashchange = handleHashChange;

    function main() {
        updateCommentsCount();
        content.innerHTML = '';
        loading.style.display = 'block';

        if (path.startsWith('/search')) {
            search(path.split('/')[2]);
        } else if (path && !path.startsWith('/page')) {
            disqus_url = `${hostbase}${path.toLowerCase()}`;
            showPost(path);
            loadDisqus();
        } else {
            document.title = sitetitle;
            if (postList) {
                showList(postList);
            } else {
                pending = true;
                document.getElementById('takinglonger').style.display = 'none';
                checkTakingLonger();
                loadPostList();
            }
        }
    }

    function updateCommentsCount() {
        const disqusCounts = document.getElementsByName('commentscount');
        disqusCounts.forEach((countElem) => {
            const id = Number(countElem.id.slice(5));
            commentscount[id] = countElem.innerText;
        });
    }

    function loadDisqus() {
        const dsq = document.createElement('script');
        dsq.type = 'text/javascript';
        dsq.async = true;
        dsq.src = `//${disqus_shortname}.disqus.com/embed.js`;
        document.head.appendChild(dsq);
    }

    function loadPostList() {
        const script = document.createElement('script');
        script.src = `https://proxy.hancat.work/hancat/https/api.github.com/repos/${githubname}/${repos}/contents/md?callback=showlist${branch ? `&ref=${branch}` : ''}`;
        document.head.appendChild(script);
    }

    function showPost(path) {
        const url = `${location.protocol}//${location.hostname}${isRoot ? '' : `/${repos}`}/md/${path.slice(1).replace(/\//g, '-')}${suffix || ''}`;
        document.title = `${decodeUtf8(getPostName(path))} - ${sitetitle}`;
        pdate = path.slice(1).split('/').slice(0, 3).join('-');
        loadXMLDoc(url);
    }

    function showList(list) {
        if (path.startsWith('/page')) {
            page = Number(path.split('/')[2]) || 1;
            if (page === 1) {
                window.history.replaceState(null, '', `${isRoot ? '' : `/${repos}`}/`);
            }
        }

        pending = false;
        document.getElementById('takinglonger').style.display = 'none';
        postList = list;

        let txt = '';
        const start = list.data.length - (page - 1) * 20;
        const end = Math.max(start - 20, 0);

        for (let i = start; i > end; i--) {
            let postName = list.data[i - 1].name;
            if (suffix && postName.endsWith(suffix)) {
                postName = postName.slice(0, -suffix.length);
            }

            const postPath = encodePath(postName, true);
            txt += `<blockquote class="layui-elem-quote">
                        <postlist>
                            <a href="${isRoot ? '' : `/${repos}`}#!/${postPath}">
                                ${getPostName(postName)}
                            </a>
                            <div class="post_info">
                                <span class="post_date">Posted at ${postName.split('-').slice(0, 3).join('-')}</span>
                                <span class="disqus_count">
                                    <a href="${hostbase}/${encodePath(postName, false)}${commentscount[i] ? '' : '#disqus_thread'}" name="commentscount" id="post-${i}">
                                        ${commentscount[i] || ''}
                                    </a>
                                </span>
                            </div>
                        </postlist>
                    </blockquote>`;
        }

        if (page * 20 < list.data.length) {
            txt += `<postlist>
                        <a class="prev_page" href="${isRoot ? '' : `/${repos}`}#!/page/${page + 1}">← 较早的文章</a>
                        <div style="clear:both"></div>
                    </postlist>`;
        } else if (page > 1) {
            txt += `<postlist>
                        <a class="next_page" href="${isRoot ? '' : `/${repos}`}#!/page/${page - 1}">较新的文章 →</a>
                        <div style="clear:both"></div>
                    </postlist>`;
        }

        loading.style.display = 'none';
        content.innerHTML = txt;
        loadDisqusCount();
    }

    function loadDisqusCount() {
        const script = document.createElement('script');
        script.async = true;
        script.type = 'text/javascript';
        script.src = `//${disqus_shortname}.disqus.com/count.js`;
        document.head.appendChild(script);
    }

    function handleHashChange() {
        if (location.hash && location.hash[1] !== '!') {
            window.history.replaceState(null, '', `${isRoot ? '' : `/${repos}`}#!${path}`);
            return;
        }

        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        dis.style.display = 'none';
        dis.innerHTML = '';
        path = location.hash.slice(2);
        main();
    }

    function encodePath(path, isdecode) {
        path = encodeURIComponent(path).replace(/%/g, (match, i, str) => str.slice(i, i + 3).toLowerCase());
        return isdecode ? decodeUtf8(path) : path;
    }

    function decodeUtf8(str) {
        try {
            const tmp = decodeURIComponent(str);
            return tmp === str ? str : decodeUtf8(tmp);
        } catch (e) {
            return str;
        }
    }

    function getPostName(name) {
        return name.replace(/^\//, '').replace(/\//g, '-').split('-').slice(3).join('-').replace(/_/g, ' ');
    }

    function loadXMLDoc(url) {
        const xmlhttp = new XMLHttpRequest();
        pending = true;
        document.getElementById('takinglonger').style.display = 'none';
        checkTakingLonger();

        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState === 4) {
                pending = false;
                document.getElementById('takinglonger').style.display = 'none';
                loading.style.display = 'none';

                if (xmlhttp.status === 200) {
                    let blog_text = xmlhttp.responseText;
                    let encoded = false;

                    if (blog_text.startsWith('::')) {
                        blog_text = Base64.decode(blog_text.slice(2));
                        encoded = true;
                    }

                    blog_text = filterJekyllHeader(blog_text);
                    content.innerHTML = `
                        <div id="content_inner">
                            <div id="back_home">
                                <a href="/" onclick="home(); return false;">${sitetitle}</a>
                                <span>&nbsp;›&nbsp;</span>
                                <hr class="ws-space-16">
                            </div><br>
                            <center>
                                <div id="post_title">
                                    <h1>${decodeUtf8(getPostName(path))}${encoded ? Base64.decode('PHN1cCBzdHlsZT0iZm9udC1zaXplOjAuNWVtO3ZlcnRpY2FsLWFsaWduOiBzdXBlcjsiIHRpdGxlPSLmraTmlofnq6Dlt7Looqvph43mlrDnvJbnoIHku6XourLpgb/lrqHmn6UiPuKYmuiiq+e8lueggeeahOWGheWuuTwvc3VwPg==') : ''}</h1>
                                </div>
                            </center>
                            <hr class="ws-space-16">
                            ${new Showdown.converter().makeHtml(blog_text)}
                            <br>
                            <div class="date">
                                <hr class="ws-space-16">发布于 ${pdate}
                            </div>
                        </div>`;
                    if (dis) {
                        dis.style.display = 'block';
                    }
                } else if (xmlhttp.status === 404) {
                    document.title = `Not Found - ${sitetitle}`;
                    content.innerHTML = '<img src="images/despicable_me.png" />';
                } else {
                    document.title = `Technology Problem - ${sitetitle}`;
                    content.innerHTML = '<img src="images/despicable_me.png" />';
                }
            }
        };

        xmlhttp.open('GET', url, true);
        xmlhttp.send();
    }

    function filterJekyllHeader(blog_text) {
        return blog_text.replace(/^---[\s\S]*?---/, '');
    }

    function checkTakingLonger() {
        if (pending) {
            setTimeout(() => {
                if (pending) {
                    document.getElementById('takinglonger').style.display = 'block';
                }
            }, 3000);
        }
    }

    window.home = () => {
        window.history.pushState(null, '', `${isRoot ? '' : `/${repos}`}/`);
        location.hash = '#!/';
    };
})();
