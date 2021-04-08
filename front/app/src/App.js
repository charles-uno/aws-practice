import './App.scss';
import React from 'react';
import axios from 'axios';


class Flashcards extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            autocard: {name: null, style: {}},
            opener: null,
            gameplay: null,
            waiting: false,
            error: {location: null, text: null}
        };
    }

    componentDidMount(){
        document.addEventListener("keydown", this.onKeyPress.bind(this), false);
    }

    componentWillUnmount(){
        document.removeEventListener("keydown", this.onKeyPress.bind(this), false);
    }

    onKeyPress(event){
        // Esc
        if(event.keyCode === 27) {
            this.hideAutocard(event)
        }
    }

    render() {
        return [
            this.renderAutocard(),
            this.renderMain(),
            this.renderFoot()
        ];
    }

    renderAutocard() {
        let uri = this.cardUri(this.state.autocard.name);
        let autocard = <img className="autocard" id="autocard" src={uri} alt={this.state.autocard.name} style={this.state.autocard.style} />
        var wrapStyle = {display: "none"};
        if (this.state.autocard.name != null) {
            wrapStyle = {display: "block"};
        }
        return <div className="autocard-wrap" style={wrapStyle} onClick={this.hideAutocard.bind(this)} key="autocard">
            {autocard}
        </div>
    }

    renderMain() {
        return <div className="main" key="main">
            {this.renderHand()}
            {this.renderPlay()}
        </div>
    }

    renderFoot() {
        return <div className="foot" key="foot">
            <span className="foot-elt center">
                &copy; Charles Fyfe 2021
            </span>
            <span className="foot-elt">
                <a href="https://github.com/charles-uno/aws-practice/blob/main/README.md">Source code on GitHub</a>
            </span>
            <span className="foot-elt">
                 <a href="https://charles.uno/amulet-simulation">About the model</a>
            </span>
        </div>
    }

    renderHand() {
        return <div className="hand-wrap">
            {this.renderHandButton()}
            <div className="hand-cards-wrap">
                <div className="hand-cards">
                    {this.renderHandImages()}
                </div>
            </div>
            {this.renderHandText()}
        </div>
    }

    renderHandButton() {
        if (this.state.waiting) {
            return <button className="button button-disabled" disabled={true}>working...</button>
        } else {
            return <button className="button" onClick={this.getNewHand.bind(this)}>draw a new opener</button>
        }
    }

    renderHandImages() {
        let imgs = [];
        for (let i=0; i<7; i++) {
            if (this.state.opener === null) {
                imgs.push(
                    <img className="hand-card" src={this.cardUri("back")} alt="card back" key={i} />
                );
            } else {
                let c = this.state.opener.hand[i];
                imgs.push(
                    <img className="hand-card" src={this.cardUri(c)} alt="card back" key={i} onClick={this.showAutocard.bind(this, c)} />
                );
            }
        }
        return imgs;
    }

    renderHandText() {
        if (this.state.error.location === "opener") {
            return <div className="error-message vertical-center">
                {this.state.error.text}
            </div>
        }
        let text = "";
        if (this.state.opener === null) {
            text = "";
        } else if (this.state.opener.onThePlay === true) {
            text = "you are on the play";
        } else if (this.state.opener.onThePlay === false) {
            text = "you are on the draw";
        }
        return <div className="turn-order">{text}</div>
    }

    renderPlay() {
        if (this.state.opener === null) {
            return "";
        }
        return <div className="play-wrap">
            {this.renderPlayButton()}
            {this.renderPlayLines()}
            {this.renderPlayOutcome()}
        </div>
    }

    renderPlayButton() {
        if (this.state.waiting) {
            return <button className="button button-disabled" disabled={true}>working...</button>
        } else {
            return <button className="button" onClick={this.getNewPlay.bind(this)}>play it out</button>
        }
    }

    renderPlayLines() {
        if (this.state.error.location === "gameplay") {
            console.log("gameplay error!");
            return <div className="error-message">
                {this.state.error.text}
            </div>
        }
        if (this.state.gameplay === null) {
            return "";
        }
        let linesRaw = [];
        linesRaw.push([]);
        for (let tag of this.state.gameplay.plays) {
            if (tag.type === "break") {
                linesRaw.push([]);
            } else {
                linesRaw[linesRaw.length-1].push(tag);
            }
        }
        // Drop the first line. We already know about the opening hand.
        linesRaw.shift();
        let lines = [];
        for (let i in linesRaw) {
            if (linesRaw[i].length > 0) {
                lines.push(this.renderPlayLine(linesRaw[i], i));
            }
        }
        return <div className="play-lines">{lines}</div>
    }

    renderPlayLine(lineRaw, lineNumber) {
        let words = [];
        let classNames = "play-line";
        for (let i in lineRaw) {
            let wordRaw = lineRaw[i];
            if (wordRaw.type === "mana") {
                let imgs = this.renderMana(wordRaw.text);
                words.push(
                    <span className="mana-expr" key={i}>
                        {imgs}
                    </span>
                );
            } else if (wordRaw.type === "land" || wordRaw.type === "spell") {
                words.push(this.card(wordRaw.text, key=i));
            } else {
                if (wordRaw.text.toLowerCase().startsWith("turn")) {
                    classNames += " turn-start";
                }
                words.push(
                    <span className="text" key={i}>{wordRaw.text}</span>
                );
            }
            key += 1;
        }
        let key = "line-" + lineNumber.toString();
        return <p className={classNames} key={key}>{words}</p>
    }

    card(cardName, key=null) {
        return <span className="card" key={key} onClick={this.showAutocard.bind(this, cardName)}>
            {cardName}
        </span>
    }

    renderPlayOutcome() {
        let className = "play-outcome ";
        if (this.state.gameplay === null) {
            ;
        } else if (this.state.gameplay.turn === 2) {
            className += "play-blue";
        } else if (this.state.gameplay.turn === 3) {
            className += "play-green";
        } else if (this.state.gameplay.turn === 4) {
            className += "play-yellow";
        } else {
            className += "play-red";
        }
        let text = "no solution before turn 5";
        if (this.state.gameplay === null) {
            text = "";
        } else if (this.state.gameplay.turn > 0) {
            text = "done on turn " + this.state.gameplay.turn.toString();
        }
        return <div className={className}>{text}</div>
    }

    showAutocard(cardName) {
        this.setState({
            autocard: {name: cardName, style: {display: true}}
        });
    }

    hideAutocard(event) {
        this.setState({
            autocard: {name: null, style: {display: "none"}}
        });
    }

    renderMana(m) {
        let imgs = [];
        for (let i=0; i<m.length; i++) {
            let alt = "{" + m[i] + "}";
            imgs.push(
                <img src={this.manaUri(m[i])} className="mana-symbol" alt={alt} key={i} />
            );
        }
        return imgs;
    }

    async getNewHand() {
        this.setState({
            opener: null,
            gameplay: null,
            waiting: true,
            error: {location: null, text: null}
        });
        try {
            const response = await axios.get(`/api/hand`);
            this.setState({opener: response.data});
        } catch (err) {
            console.log(err);
            this.setState({
                error: {location: "opener", text: err.toString()}
            });
        }
        this.setState({waiting: false});
    }

    async getNewPlay() {
        this.setState({
            gameplay: null,
            error: {location: null, text: null},
            waiting: true
        });
        try {
            let payload = this.state.opener;
            const response = await axios.post(`/api/play`, payload);
            this.setState({gameplay: response.data});
        } catch (err) {
            console.log(err);
            this.setState({
                error: {location: "gameplay", text: err.toString()}
            });
        }
        this.setState({waiting: false});
    }

    cardUri(c) {
        if (c === null) {
            c = "back";
        }
        return "https://gatherer.wizards.com/Handlers/Image.ashx?type=card&name=" + c;
    }

    manaUri(m) {
        return "https://gatherer.wizards.com/Handlers/Image.ashx?size=medium&type=symbol&name=" + m;
    }

}




export default Flashcards;
