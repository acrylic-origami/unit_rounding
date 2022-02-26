import React from 'react';
import Autocomplete from 'react-autocomplete';

export default class extends React.Component {
	constructor(props) {
		super(props);
		this.uri_stash = React.createRef();
		this.form_ref = React.createRef();
		this.term_unit_ref = React.createRef();
		this.term_start_ref = React.createRef();
		this.term_end_ref = React.createRef();
		
		this.state = {
			result: null,
			term_unit: null,
			term_start: null,
			term_end: null,
			unit_pool: 'EXOTIC',
			n_request: 0,
			n_fulfilled: 0,
			request: null,
			err: null,
			copying: false,
			show_long_units: true,
			show_usage_notes: false,
			common_units: []
		};
		window.addEventListener('popstate', this.handle_uri_term);
	}
	componentDidMount() {
		this.term_unit_ref.current.focus();
		this.handle_uri_term();
		
		fetch('/end/common_units', { method: 'GET' }).then(v => v.json()).then(({ common_units }) => this.setState({ common_units }))
	}
	
	handle_uri_term = () => {
		const U = new URLSearchParams(window.location.search);
		const terms = ['unit', 'start', 'end'].map(k => U.get(`term_${k}`));
		const [term_unit, term_start, term_end] = terms;
		if(terms.reduce((a, b) => a && b !== null && b !== '', true)) {
			this.setState({ term_unit, term_start, term_end, unit_pool: U.get('unit_pool') || 'EXOTIC' }, _ => this.onSubmit());
		}
	}
	
	onSubmit = e => {
		history.pushState({}, `search`, '?' + ['unit', 'start', 'end'].map(a => `term_${a}=${encodeURI(this[`term_${a}_ref`].current.value)}`).join('&') + '&unit_pool=' + encodeURI(this.state.unit_pool));
		this.setState(({ n_request }) => ({ n_request: n_request + 1 }));
		if(e !== undefined) {
			e.preventDefault();
			e.stopPropagation();
		}
		return false;
	}
	handleInput = (k, e) => this.setState({ [k]: e.target.value });
	handleToggleShowLongUnits = e => this.setState({ show_long_units: e.target.checked })
	handleChangeUnitPool = e => this.setState({ unit_pool: e.target.value })
	
	componentDidUpdate(_, l) {
		if(this.state.err !== null && !this.state.err[1]) {
			const this_err = this.state.err[0];
			this.setState(({ err }) => err !== null && (err[0] === this_err ? { err: [this_err, true] } : {}));
			setTimeout(_ => this.setState(({ err }) => err !== null && (err[0] === this_err ? { err: null } : {})), 4000);
		}
		if(this.state.copying) {
			setTimeout(_ => this.setState({ copying: false }), 1000);
		}
		if(l.n_request != this.state.n_request) {
			console.log(l.n_request, this.state.n_request)
			const n_request_stash = this.state.n_request;
			const [unit, start, end] = [this.term_unit_ref, this.term_start_ref, this.term_end_ref].map(a => a.current.value
				.trim()
				.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
				
			const fail = e => {
				console.log(e);
				this.setState(s => (n_request_stash === s.n_request) && { err: [e.message, false], n_fulfilled: n_request_stash });
			}
			fetch(`/end/q`, { method: 'POST', body: new FormData(this.form_ref.current) })
				.then(r => r.json().then(j => { if(r.ok) return j; else throw new Error(j.err); }))
				.then(r => this.setState(s => (n_request_stash === s.n_request) && { result: r, n_fulfilled: n_request_stash }), fail);
		}
	}
	
	handleToggleShowUsageNotes = e => this.setState(s => ({ show_usage_notes: !s.show_usage_notes }))
	
	copyURI = () => {
		navigator.clipboard.writeText(window.location.href);
		
		// const past_focus = document.activeElement;
		// this.uri_stash.current.value = window.location.href;
		// this.uri_stash.current.select();
		// document.execCommand('copy');
		// past_focus.focus();
		
		this.setState({ copying: true });
	}
	
	handleChangeUnit = term_unit => this.setState({ term_unit })
	
	render = () => <div>
		<section id="input_section">
				<form onSubmit={this.onSubmit} id="term_form" ref={this.form_ref}>
					{
						(() => {
							const formatter = (name, placeholder, props) => 
									<span className="input-outer-wrapper">
										<span className="input-inner-wrapper">
											<input type="text" placeholder={placeholder} id={`term_${name}`} name={`term_${name}`} onChange={e => this.handleInput(`term_${name}`, e)} value={this.state[`term_${name}`] || ''} ref={this[`term_${name}_ref`]} {...props} />
											{ (this.state.n_request > this.state.n_fulfilled) && <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div> }
										</span>
										<label htmlFor={`term_${name}`}>{name}</label>
									</span>;
							return <ul className="flat-list" id="input_container">
								<li>
									{formatter('start', 'Starting # (e.g. 17)', { type: 'number' })}
									{/*{formatter('unit', 'Unit (e.g. mph)')}
								
									 	// type="text"
									  // className="unit-box"
									  // id="unit_box"*/}
									<span id="unit_wrapper">
										<Autocomplete
											getItemValue={({ name }) => name}
										  items={this.state.common_units}
										  renderItem={(item, isHighlighted) =>
										    <div key={item['name']} className={ `unit-autocomplete-item ${isHighlighted ? 'focused' : ''}` }>
										      <span className="unit-autocomplete-long-name">{item['long_name']}</span>
										      &nbsp;<span className='unit-autocomplete-short-name'>({item['name']})</span>
										    </div>
										  }
										  shouldItemRender={(item, value) => value.length > 0 && (item['long_name'].toLowerCase().indexOf(value.toLowerCase()) > -1 || item['name'].toLowerCase().indexOf(value.toLowerCase()) > -1)}
										  inputProps={{
										  	type: 'text',
										  	name: 'term_unit',
										  	id: 'term_unit',
										  	placeholder: 'Unit (e.g. mph)'
										  }}
										  placeholder="ASDF"
										  value={this.state.term_unit || ''}
										  onChange={e => this.handleInput(`term_unit`, e)}
										  onSelect={v => this.handleInput(`term_unit`, { target: { value: v } })}
										/>
										<label htmlFor={`term_unit`}>unit</label>
									</span>
								</li>
								<li id="convert_cell">
									<span className="select-wrapper">
										<select name="unit_pool" value={ this.state.unit_pool } onChange={ this.handleChangeUnitPool }>
											<option value="EXOTIC" key={1}>Exotic units</option>
											<option value="WIKI" key={2}>Wikipedia units</option>
											{/*<option value="CHEAT" key={3}>Cheating units</option>*/}
										</select>
									</span>
									<span className="arrow"></span>
								</li>
								<li>
									{formatter('end', 'Ending # (e.g. 45)', { type: 'number', step: '1' })}
									{formatter('unit', 'Unit', { disabled: true, id: 'term_unit_mirror' })}
								</li>
								<li>
									<input type="submit" value="Submit" />
								</li>
							</ul>;
						})()
					}
				</form>
			</section>
			{ this.state.result != null
				? null
				: <section id="results_placeholder">
					Results appear after entering units and pressing <kbd>Enter</kbd>
				</section>
			}
			{
				this.state.err == null
					? null
					: <section id="error" className="group">
						<span>Error: {this.state.err[0]}</span>
					</section>
			}
			{ this.state.result && 
				<section id="results">
					<h2>{this.state.result.start} {this.state.result.unit} is{this.state.result.path.length > 0 ? ':' : ` ${Math.round(this.state.result.end)} ${this.state.result.unit}.`}</h2>
					{ this.state.result.path.length > 0 && <React.Fragment>
						<ul id="result_list">
							{ this.state.result.path.map((n, i) =>
								<li key={i}>
									<React.Fragment>
										<span className="result-size">{ (n.fro / n.factor).toFixed(3) }</span>
										&nbsp;<span className="result-unit">{ n.vto_unit }</span>
										{ this.state.show_long_units && <span className="result-long-unit">&nbsp;({n.vto_unit_long})</span> }
										&nbsp;<span className="result-rounding">
											<span style={{ fontSize: '1.4em' }}>&#10613;</span> {/*&asymp;*/}
											&nbsp;<span className="result-size">{ Math.round(n.fro / n.factor) }</span>
											&nbsp;<span className="result-unit">{ n.vto_unit }</span>
												&nbsp;<span className="result-aka">
													(AKA {(Math.round(n.fro / n.factor) * n.factor / this.state.result.unit_factor).toFixed(2)}
													&nbsp;{this.state.result.unit})
												</span>
											{/*&nbsp;<span>, which is</span>*/}
										</span>
									</React.Fragment>
								</li>) }
						</ul>
						<h2>&hellip;which is {Math.round(this.state.result.end)} {this.state.result.unit} (up to rounding error)</h2>
						<ul className="flat-list" id="result_nav">
							<li id="show_long_units_wrapper"><input type="checkbox" id="toggle_show_long_units" checked={this.state.show_long_units} onChange={this.handleToggleShowLongUnits} /><label htmlFor="toggle_show_long_units">Show long unit names</label></li>
							<li id="copy_result_wrapper">
								{ this.state.copying ?
									"Copied!" :
									<a onClick={this.copyURI}>Share this result (copy URL)</a>
								}
								<input type="text" className="hidden" ref={this.uri_stash} value={window.location.href} onChange={_ => {}} />
							</li>
						</ul>
					</React.Fragment> }
				</section>
			}
			<section id="usage_notes">
				<h2 onClick={this.handleToggleShowUsageNotes}>Usage notes { this.state.show_usage_notes ? <React.Fragment>&#x25BC;</React.Fragment> : <React.Fragment>&#x25c0;</React.Fragment> }</h2>
				<ul className={ this.state.show_usage_notes ? '' : 'hidden' }>
					<li><em>Entering units:</em> Any unit symbol available from the <a href="//en.wikipedia.org/wiki/Module:Convert/data">Wikipedia Conversion Tool</a> can be used, which includes most of the conventional and many unconventional units. They are case sensitive.</li>
					<ul>
						<li>Units can be multiplied by separating with spaces, *, or &middot;. Units can be divided by separating with / or &#247;.</li>
						<li>Units can be bracketed, e.g. <code>km/(gal/day) * A</code></li>
						<li>Where names conflict or aren't found, try spelling out the whole name, or fall back to SI units (s,kg,m,K,A,cd,mol)</li>
					</ul>
					<li><em>Intermediate units:</em> A few unit sets are available to use for rounding:</li>
					<ol>
						<li><em>Wikipedia units:</em> Only units directly found in the Wikipedia Conversion Tool can serve as intermediate units.</li>
						<li><em>Exotic units:</em> All combinations of two units from the Wikipedia Conversion Tool can serve as intermediate units. This greatly improves the hitrate &mdash; the baseline set of units by itself is too sparse to converge much of the time</li>
						{/*<li><em>Cheating units:</em> Powers of a unitless unit are tacked onto the input term successively until it converges. The results aren't quite as interesting, but this is viable. The intermediate units are still in the same base as the original, just without much physical meaning.</li>*/}
					</ol>
				</ul>
			</section>
	</div>
}
