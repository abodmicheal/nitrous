/* eslint react/prop-types: 0 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import tt from 'counterpart';
import { List, OrderedMap } from 'immutable';
import { actions as fetchDataSagaActions } from 'app/redux/FetchDataSaga';
import constants from 'app/redux/constants';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import {
    INTERLEAVE_PROMOTED,
    TAG_LIST,
    RECOMMENDED_FOLLOW_ACCOUNT,
} from 'app/client_config';
import PostsList from 'app/components/cards/PostsList';
import { isFetchingOrRecentlyUpdated } from 'app/utils/StateFunctions';
import Callout from 'app/components/elements/Callout';
import SidebarLinks from 'app/components/elements/SidebarLinks';
import Notices from 'app/components/elements/Notices';
import GptAd from 'app/components/elements/GptAd';
import ReviveAd from 'app/components/elements/ReviveAd';
import ArticleLayoutSelector from 'app/components/modules/ArticleLayoutSelector';
import Topics from './Topics';
import SortOrder from 'app/components/elements/SortOrder';
import { PROMOTED_POST_PAD_SIZE } from 'shared/constants';
import tagHeaderMap from 'app/utils/TagFeedHeaderMap';
import MarkdownViewer from 'app/components/cards/MarkdownViewer';

import * as globalActions from 'app/redux/GlobalReducer';

import SidebarBurn from 'app/components/elements/SidebarBurn';
import SidebarInfo from 'app/components/elements/SidebarInfo';
import SidebarSwap from 'app/components/elements/SidebarSwap';
import SidebarThumbsup from 'app/components/elements/SidebarThumbsup';

class PostsIndex extends React.Component {
    static propTypes = {
        discussions: PropTypes.object,
        feed_posts: PropTypes.object,
        status: PropTypes.object,
        routeParams: PropTypes.object,
        requestData: PropTypes.func,
        loading: PropTypes.bool,
        username: PropTypes.string,
        blogmode: PropTypes.bool,
        categories: PropTypes.object,
    };

    static defaultProps = {
        showSpam: false,
    };

    constructor() {
        super();
        this.state = {};
        this.loadMore = this.loadMore.bind(this);
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'PostsIndex');
    }

    componentDidUpdate(prevProps) {
        if (
            window.innerHeight &&
            window.innerHeight > 3000 &&
            prevProps.discussions !== this.props.discussions
        ) {
            this.refs.list.fetchIfNeeded();
        }
    }

    getPosts(order, category) {
        const pinned = this.props.pinned;
        const pinnedPosts = pinned
            ? pinned.has('pinned_posts')
              ? pinned.get('pinned_posts').toJS()
              : []
            : [];
        const notices = this.props.notices || [];
        const topic_discussions =
            this.props.discussions != null
                ? this.props.discussions.get(category || '')
                : null;
        if (!topic_discussions) return { posts: List(), promotedPosts: List() };
        const mainDiscussions = topic_discussions.get(order);
        if (INTERLEAVE_PROMOTED && (order === 'trending' || order === 'hot')) {
            let promotedDiscussions = topic_discussions.get('promoted');
            if (
                promotedDiscussions &&
                promotedDiscussions.size > 0 &&
                mainDiscussions
            ) {
                const processed = new Set(
                    pinnedPosts.map(p => `${p.author}/${p.permlink}`)
                ); // mutable
                const interleaved = [];
                const promoted = [];
                let promotedIndex = 0;
                for (let i = 0; i < mainDiscussions.size; i++) {
                    if (i % PROMOTED_POST_PAD_SIZE === 0) {
                        while (
                            processed.has(
                                promotedDiscussions.get(promotedIndex)
                            ) &&
                            promotedIndex < promotedDiscussions.size
                        ) {
                            promotedIndex++;
                        }
                        if (promotedIndex < promotedDiscussions.size) {
                            const nextPromoted = promotedDiscussions.get(
                                promotedIndex
                            );
                            interleaved.push(nextPromoted);
                            promoted.push(nextPromoted);
                            processed.add(nextPromoted);
                        }
                    }
                    const nextDiscussion = mainDiscussions.get(i);
                    if (!processed.has(nextDiscussion)) {
                        interleaved.push(nextDiscussion);
                        processed.add(nextDiscussion);
                    }
                }
                return {
                    posts: List(interleaved),
                    promotedPosts: List(promoted),
                };
            }
        }
        return { posts: mainDiscussions || List(), promotedPosts: List() };
    }

    loadMore(last_post) {
        if (!last_post) return;
        let {
            accountname,
            category,
            order = constants.DEFAULT_SORT_ORDER,
        } = this.props.routeParams;
        if (category === 'feed') {
            accountname = order.slice(1);
            order = 'by_feed';
        }
        if (isFetchingOrRecentlyUpdated(this.props.status, order, category))
            return;
        const [author, permlink] = last_post.split('/');
        this.props.requestData({
            author,
            permlink,
            order,
            category,
            accountname,
        });
    }
    onShowSpam = () => {
        this.setState({ showSpam: !this.state.showSpam });
    };

    searchCategories(cat, parent, categories) {
        if (!cat) return { par: parent, cats: categories, found: false };

        // leaf nodes
        if (List.isList(categories)) {
            if (categories.includes(cat))
                return { par: parent, cats: categories, found: true };
            else return { par: parent, cats: null, found: false };
        } else {
            for (const c of categories.keys()) {
                const v = categories.get(c);
                if (cat === c && v !== null && !v.isEmpty()) {
                    return { par: parent, cats: v, found: true };
                } else {
                    const { par, cats, found } = this.searchCategories(
                        cat,
                        c,
                        v
                    );
                    if (cats !== null && !cats.isEmpty()) {
                        return { par, cats, found };
                    }
                }
            }
            return { par: parent, cats: null, found: false };
        }
    }
    goSCTSWAP = () => {
        window.open('/market');
    };
    goHODLS = () => {
        window.open('https://hodls.money/');
    };
    goPicpPick = () => {
        window.open('https://apisct.cloud/manager');
    };

    goNoticeTelegram = () => {
        window.open('https://t.me/sct_notice');
    };

    goExchangeNow = () => {
        // window.open('/support.html');
    };

    showSCTMBurn = () => {
        // const post_content = this.props.cont.get(this.props.post);
        // if (!post_content) return;
        // const author = post_content.get('author');
        // const permlink = post_content.get('permlink');
        this.props.showSCTMBurn();
    };

    buildCategories(cat, parent, categories) {
        if (!categories) return this.props.categories;

        if (!cat) {
            return categories;
        } else {
            let cats = OrderedMap();
            if (categories.includes(cat)) cats = categories;
            else cats = cats.set(cat, categories);
            if (parent !== null) {
                const children = cats;
                cats = OrderedMap();
                cats = cats.set(parent, children);
            }
            return cats;
        }
    }

    render() {
        var Iframe = React.createClass({
            render: function() {
                return (
                    <div>
                        <iframe
                            id="converterSteem"
                            name="widget"
                            src={this.props.src}
                            width="100%"
                            height="300px"
                        />
                    </div>
                );
            },
        });

        let {
            category,
            order = constants.DEFAULT_SORT_ORDER,
        } = this.props.routeParams;

        const { discussions, pinned } = this.props;
        const { par, cats, found } = this.searchCategories(
            category,
            null,
            this.props.categories
        );
        const categories = this.buildCategories(category, par, cats);
        const max_levels = category && found ? 3 : 2;

        let topics_order = order;
        let posts = List();
        let promotedPosts = List();
        let account_name = '';
        let emptyText = '';
        if (category === 'feed') {
            account_name = order.slice(1);
            order = 'by_feed';
            topics_order = 'hot';
            posts = this.props.feed_posts;
            const isMyAccount = this.props.username === account_name;
            if (isMyAccount) {
                emptyText = (
                    <div>
                        {tt('posts_index.empty_feed_1')}.<br />
                        <br />
                        {tt('posts_index.empty_feed_2')}.<br />
                        <br />
                        <Link to="/hot">{tt('posts_index.empty_feed_3')}</Link>
                        <br />
                    </div>
                );
            } else {
                emptyText = (
                    <div>
                        {tt('user_profile.user_hasnt_followed_anything_yet', {
                            name: account_name,
                        })}
                    </div>
                );
            }
        } else {
            const processedPosts = this.getPosts(order, category);
            posts = processedPosts.posts;
            promotedPosts = processedPosts.promotedPosts;
            if (posts && posts.size === 0) {
                emptyText = (
                    <div>
                        {'No ' +
                            topics_order +
                            (category ? ' #' + category : '') +
                            ' posts found'}
                    </div>
                );
            }
        }

        const status = this.props.status
            ? this.props.status.getIn([category || '', order])
            : null;
        const fetching = (status && status.fetching) || this.props.loading;
        const { showSpam } = this.state;

        // If we're at one of the four sort order routes without a tag filter,
        // use the translated string for that sort order, f.ex "trending"
        //
        // If you click on a tag while you're in a sort order route,
        // the title should be the translated string for that sort order
        // plus the tag string, f.ex "trending: blog"
        //
        // Logged-in:
        // At homepage (@user/feed) say "My feed"
        let page_title = 'Posts'; // sensible default here?
        if (category === 'feed') {
            if (account_name === this.props.username)
                page_title = tt('posts_index.my_feed');
            else if (
                this.props.location.pathname ===
                `/@${RECOMMENDED_FOLLOW_ACCOUNT}/feed`
            )
                page_title = tt('g.recommend');
            else
                page_title = tt('posts_index.accountnames_feed', {
                    account_name,
                });
        } else {
            switch (topics_order) {
                case 'created':
                    page_title = tt('g.new');
                    break;
                case 'hot':
                    page_title = tt('main_menu.hot');
                    break;
                case 'promoted':
                    page_title = tt('g.promoted');
                    break;
                // case 'market':
                //     page_title = tt('g.market');
                //     break;
                case 'exchangeNow':
                    page_title = 'exchangeNow';
                    break;
                // case 'review':
                //     page_title = tt('g.review');
                //     break;
            }
            if (typeof category !== 'undefined') {
                page_title = `${page_title}: ${category}`; // maybe todo: localize the colon?
            } else {
                page_title = `${page_title}: ${tt('g.all_tags')}`;
            }
        }
        const layoutClass = this.props.blogmode
            ? ' layout-block'
            : ' layout-list';

        const mqLarge =
            process.env.BROWSER &&
            window.matchMedia('screen and (min-width: 75em)').matches;

        return (
            <div
                className={
                    'PostsIndex row' +
                    (fetching ? ' fetching' : '') +
                    layoutClass
                }
            >
                <article className="articles">
                    <div className="articles__header row">
                        <div className="small-6 medium-6 large-6 column">
                            <h1 className="articles__h1 show-for-mq-large articles__h1--no-wrap">
                                {page_title}
                            </h1>
                            <span className="hide-for-mq-large articles__header-select">
                                <Topics
                                    username={this.props.username}
                                    order={topics_order}
                                    current={category}
                                    categories={categories}
                                    compact
                                    levels={max_levels}
                                />
                            </span>
                        </div>
                        <div className="small-6 medium-5 large-5 column hide-for-large articles__header-select">
                            <SortOrder
                                sortOrder={this.props.sortOrder}
                                topic={this.props.topic}
                                horizontal={false}
                            />
                        </div>
                        <div className="medium-1 show-for-mq-medium column">
                            <ArticleLayoutSelector />
                        </div>
                    </div>
                    {category !== 'feed' && (
                        <MarkdownViewer
                            text={tagHeaderMap[category] || tagHeaderMap['']}
                        />
                    )}
                    <hr className="articles__hr" />
                    {!fetching &&
                    (posts && !posts.size) &&
                    (pinned && !pinned.size) ? (
                        <Callout>{emptyText}</Callout>
                    ) : (
                        <PostsList
                            ref="list"
                            posts={posts}
                            loading={fetching}
                            anyPosts
                            category={category}
                            loadMore={this.loadMore}
                            showPinned={true}
                            showSpam={showSpam}
                            promoted={promotedPosts}
                        />
                    )}
                </article>

                <aside className="c-sidebar c-sidebar--right">
                    <button
                        type="button"
                        className="c-sidebar--right--link"
                        onClick={this.goNoticeTelegram}
                    >
                        {tt('g.noticeMessanger')}
                    </button>
                    <button
                        type="button"
                        className="c-sidebar--right--link"
                        onClick={this.goPicpPick}
                    >
                        {tt('g.luckydraw')}
                    </button>
                    {/* <img
                        src="https://changenow.io/images/embeds/button.svg"
                        alt="ChangeNOW button"
                        style={{
                            margin: '0px 0px 10px 0px',
                            cursor: 'pointer',
                        }}
                        onClick={this.goExchangeNow}
                    /> */}
                    <button
                        type="button"
                        className="c-sidebar--right--link"
                        onClick={this.goSCTSWAP}
                    >
                        {tt('g.sctswap')}
                    </button>
                    <button
                        type="button"
                        className="c-sidebar--right--link"
                        onClick={this.goHODLS}
                    >
                        {tt('g.hodls_money')}
                    </button>

                    {this.props.isBrowser && (
                        <div>
                            <SidebarSwap />
                        </div>
                    )}
                    {this.props.isBrowser &&
                        this.props.scotBurn && (
                            <div>
                                <SidebarBurn
                                    scotToken={this.props.scotBurn.getIn([
                                        'scotMinerToken',
                                    ])}
                                    scotTokenCirculating={this.props.scotBurn.getIn(
                                        [
                                            'total_token_miner_balances',
                                            'circulatingSupply',
                                        ]
                                    )}
                                    scotTokenBurn={this.props.scotBurn.getIn([
                                        'token_miner_burn_balances',
                                        'balance',
                                    ])}
                                    scotTokenStaking={this.props.scotBurn.getIn(
                                        [
                                            'total_token_miner_balances',
                                            'totalStaked',
                                        ]
                                    )}
                                    sct_to_steemp={this.props.scotInfo.getIn([
                                        'sct_to_steemp',
                                    ])}
                                    steem_to_krw={this.props.scotInfo.getIn([
                                        'steem_to_krw',
                                    ])}
                                    sctm_price={this.props.scotInfo.getIn([
                                        'sctm_price',
                                    ])}
                                    received_sctm={this.props.scotInfo.getIn([
                                        'received_sctm',
                                    ])}
                                    received_list={this.props.scotInfo.getIn([
                                        'received_list',
                                    ])}
                                    krwp_balance={this.props.scotInfo.getIn([
                                        'krwp_balance',
                                    ])}
                                />

                                <button
                                    type="button"
                                    className="c-sidebar--right--link"
                                    onClick={this.showSCTMBurn}
                                >
                                    {tt('sctmburn.title')}
                                </button>
                            </div>
                        )}
                    {this.props.isBrowser &&
                        this.props.scotInfo && (
                            <div>
                                <SidebarInfo
                                    sct_to_steemp={this.props.scotInfo.getIn([
                                        'sct_to_steemp_current',
                                    ])}
                                    steem_to_dollor={this.props.scotInfo.getIn([
                                        'steem_to_dollar_current',
                                    ])}
                                    steem_to_krw={this.props.scotInfo.getIn([
                                        'steem_to_krw_current',
                                    ])}
                                />
                            </div>
                        )}

                    {this.props.isBrowser &&
                        this.props.scotBurn && (
                            <div>
                                <SidebarBurn
                                    scotToken={this.props.scotBurn.getIn([
                                        'scotToken',
                                    ])}
                                    scotTokenCirculating={this.props.scotBurn.getIn(
                                        [
                                            'total_token_balance',
                                            'circulatingSupply',
                                        ]
                                    )}
                                    scotTokenBurn={this.props.scotBurn.getIn([
                                        'token_burn_balance',
                                        'balance',
                                    ])}
                                    scotTokenStaking={this.props.scotBurn.getIn(
                                        ['total_token_balance', 'totalStaked']
                                    )}
                                />
                            </div>
                        )}

                    {this.props.isBrowser &&
                        this.props.scotThumbsup && (
                            <div>
                                <SidebarThumbsup
                                    thumbsUpReceiveList={this.props.scotThumbsup.getIn(
                                        ['receiveList']
                                    )}
                                    thumbsUpSendList={this.props.scotThumbsup.getIn(
                                        ['sendList']
                                    )}
                                />
                            </div>
                        )}
                    {this.props.gptEnabled && allowAdsOnContent ? (
                        <div className="sidebar-ad">
                            <GptAd
                                type="Freestar"
                                id="bsa-zone_1566495004689-0_123456"
                            />
                        </div>
                    ) : null}
                    {this.props.reviveEnabled && mqLarge ? (
                        <div className="sidebar-ad">
                            <ReviveAd adKey="sidebar_right" />
                        </div>
                    ) : null}
                </aside>
                <aside className="c-sidebar c-sidebar--left">
                    <Notices notices={this.props.notices} />

                    {/* <Iframe
                        title="Rfdax Converter"
                        src="https://rfdax.steemscan.com?sct.admin"
                    /> */}

                    <Topics
                        order={topics_order}
                        current={category}
                        compact={false}
                        username={this.props.username}
                        categories={categories}
                        levels={max_levels}
                    />
                    {/* <small>
                        <a
                            className="c-sidebar__more-link"
                            onClick={this.onShowSpam}
                        >
                            {showSpam
                                ? tt('g.next_3_strings_together.show_less')
                                : tt('g.next_3_strings_together.show_more')}
                        </a>
                        {' ' + tt('g.next_3_strings_together.value_posts')}
                    </small> */}

                    {this.props.gptEnabled && allowAdsOnContent ? (
                        <div>
                            <div className="sidebar-ad">
                                <GptAd
                                    type="Freestar"
                                    slotName="bsa-zone_1566494461953-7_123456"
                                />
                            </div>
                            <div
                                className="sidebar-ad"
                                style={{ marginTop: 20 }}
                            >
                                <GptAd
                                    type="Freestar"
                                    slotName="bsa-zone_1566494856923-9_123456"
                                />
                            </div>
                        </div>
                    ) : null}
                    {this.props.reviveEnabled && mqLarge ? (
                        <div className="sidebar-ad">
                            <ReviveAd adKey="sidebar_left" />
                        </div>
                    ) : null}
                </aside>
            </div>
        );
    }
}

module.exports = {
    path: ':order(/:category)',
    component: connect(
        (state, ownProps) => {
            const scotConfig = state.app.get('scotConfig');
            // special case if user feed (vs. trending, etc)
            let feed_posts;
            if (ownProps.routeParams.category === 'feed') {
                const account_name = ownProps.routeParams.order.slice(1);
                feed_posts = state.global.getIn(
                    ['accounts', account_name, 'feed'],
                    List()
                );
            }

            return {
                discussions: state.global.get('discussion_idx'),
                status: state.global.get('status'),
                loading: state.app.get('loading'),
                feed_posts,
                username:
                    state.user.getIn(['current', 'username']) ||
                    state.offchain.get('account'),
                blogmode: state.app.getIn(['user_preferences', 'blogmode']),
                sortOrder: ownProps.params.order,
                topic: ownProps.params.category,
                categories: TAG_LIST,
                pinned: state.offchain.get('pinned_posts'),
                maybeLoggedIn: state.user.get('maybeLoggedIn'),
                isBrowser: process.env.BROWSER,
                notices: state.offchain
                    .get('pinned_posts')
                    .get('notices')
                    .toJS(),
                gptEnabled: state.app.getIn(['googleAds', 'gptEnabled']),
                scotBurn: scotConfig.getIn(['config', 'burn']),
                scotInfo: scotConfig.getIn(['config', 'info']),
                scotThumbsup: scotConfig.getIn(['config', 'thumbsup']),
                reviveEnabled: state.app.get('reviveEnabled'),
            };
        },
        dispatch => {
            return {
                requestData: args =>
                    dispatch(fetchDataSagaActions.requestData(args)),
                showSCTMBurn: () => {
                    dispatch(
                        globalActions.showDialog({
                            name: 'SCTMBurn',
                            params: {},
                        })
                    );
                },
            };
        }
    )(PostsIndex),
};
