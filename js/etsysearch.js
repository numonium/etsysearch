(function(_, $){
	
	var __t;
	
	// ~EN: declare all APIs under _._
	
	_._.EtsySearch = function(args){
		
		__t = this; //scope abstractor

		// basic app configuration
		this.cfg = (args && args.cfg ? args.cfg : {
			appName : '',
			key : '',
			sharedSecret : ''
		});
		
		this.cfg.hashbang = '#!'; // use hashbang so google will index ajax results
		
		// elements to reference
		this.eles = {
			form : (args && args.search.form ? args.search.form : ''),
			search : (args && args.search.ele ? args.search.ele : ''),
			title : (args && args.search.title ? args.search.title : ''),
			results : (args && args.search.results ? args.search.results : ''), 
		};
		
		this.forms = {
			search : (args && args.search.form ? args.search.form : '')
		};
		
		this.str = { // strings to use
			titles : {
				_stub : ' - EtsySearch&trade;',
				err : 'Error :(',
				loading : 'Searching for "' + _.str.token('q') + '"...',
				results : _.str.token('num') + ' Results for "' + _.str.token('q') + '"',
				welcome : 'Welcome'
			}
		};
		
		this.tem = { // templates
			result : null
		};
		
		this.urls = {
			search : 'https://openapi.etsy.com/v2/listings/active.js?keywords=' + _.str.token('terms') + '&limit=32&includes=Images:1&api_key=' + _.str.token('key')
		};
		
		this.init(); // do all real stuff in init function
		
	};
	
	// _._.EtsySearch.prototype - to mamke this syntax more "beautiful", we declare the prototype like so, rather than having to do _._.EstySearch.prototype.func ...
	var __proto = {
		e : { // events
			
			/* hashchange(event): general router for window.hashchange events
				- URL should be in form of "#!/$cmd/$val/* */
			hashchange : function(e){
				
				var hash = window.location.hash.split('/');
				hash.shift(); // remove hashbang from url
				
				var cmd = hash.shift();
				
				if(__t.e[cmd]){
					if(cmd == 'search'){
						return __t.e.search.q.call(__t,{
							q : hash.shift()
						});
					}else{
						return __t.e[cmd].call(__t,{
							q : hash.shift()
						});
					}
				}
				
				_.log('api[etsysearch][->] ERR',cmd,hash);
			},
			
			/* reset(array): reset search fields/results/data/title */
			reset : function(args){
				this.eles.resultsList.innerHTML = '';
				this.eles.search.value = '';
				this.title(__t.str.titles.welcome);
				this.eles.results.setAttribute('data-_-state','');
			},
			search : { // search events
				/* q(array): make search query -> request to Etsy -> send response to results processor */
				q : function(args){
					var val = (args && args.q ? args.q : __t.eles.search.value);
					__t.q = val;
					
					// prepare query
					var q = _.str.tokenReplace(__t.urls.search,_.str.token('terms'),val);
					
					if(val && __t.eles.search && (__t.eles.search.value == '')){
						__t.eles.search.value = val;
						__t.eles.search.className = __t.eles.search.className.replace('_-blank','').trim();
					}
					
					_.log('api[etsysearch][q][?]',val,q);
					
					__t.title(_.str.tokenReplace(__t.str.titles.loading,_.str.token('q'),__t.q));
					__t.eles.results.setAttribute('data-_-state','loading');
					
					$.ajax({
						url : q,
						dataType : 'jsonp',
						success : function(data){
							_.log('api[etsysearch][q][*]',q,data);
							
							return __t.results({
								data : data,
								type : (!data.ok ? 'err' : (data.count === 0 ? 'empty' : '*'))
							});
							
						},
						error : function(data){
							_.log('api[etsysearch][q][*err]',q,data);
							
							return __t.results({
								data : data,
								type : 'err'
							});
						}
					});
				},
				
				/* reset(event): process "reset" button click -> just reroute to #!/reset */
				reset : function(e){
					
					window.location.href = __t.url({
						svc : 'reset'
					});

				},
				
				/* submit(event): process form submit event *or* debounced keyup event */
				submit : function(e){
					
					if(!this.eles.search){
						return false;
					}
					
					if(!this.eles.search.value){
						this.eles.search.className += ' _-blank';
						return false;
					}
					
					this.eles.search.className = this.eles.search.className.replace('_-blank','').trim();
					
					var url = this.url({
						svc : 'search',
						val : this.eles.search.value
					});
					
					_.log('api[etsysearch][q][->]',url);
					window.location.href = url;
					
					return false;
				}	
			}
		},
		
		/* init(array): set up events and other init stuff so we can get to work! :) */
		init : function(args){
			
			if(this.cfg.key){ // prepare urls, replace tokens with API keys and other cfg data
				this.urls.search = _.str.tokenReplace(this.urls.search,_.str.token('key'),this.cfg.key);
			}
			
			this.eles.resultsList = this.eles.results.getElementsByClassName('_-listing--results')[0];
			
			// get template for new result
			var result = document.getElementsByClassName('_-form--search--results--results')[0].getElementsByClassName('_-listing--item _-blank')[0];
			this.tem.result = result.cloneNode(true);
			result.parentNode.removeChild(result);

			// set up form/search event
			if(this.forms.search){
				$(this.forms.search).submit($.proxy(this.e.search.submit,this));
			}
			
			// set up debounced keyup event from query field
			if(this.eles.search){
				this.eles.search.onkeyup = _.debounce(function(e){
					return __t.e.search.submit.call(__t,e);
				},200);
			}
			
			//hash change -> router
			window.addEventListener('hashchange',this.e.hashchange);
			
			// reset button
			this.eles.form.getElementsByClassName('_-input--reset')[0].onclick = this.e.search.reset;
			
			// use existing URL (if any) for initial query
			this.e.hashchange();

		},
		
		/* makeResult(obj) - take given "obj" and construct result element
			@returns object with all result data -> result._ will be actual HTML element */
		makeResult : function(data){
			if(!data || (data.state == 'banned')){
				return false;
			}
				
			var result = {};
			
			// clone template
			result._ = this.tem.result.cloneNode(true);
			result._.setAttribute('data-_-item-uuid', data.listing_id);
			result._.className = result._.className.replace(' _-blank','');

			// ~EN (2015): one reason why I love JS is becauase of lines like this :)
			(result.a = result._.getElementsByClassName('_-listing--item--link')[0]).href = data.url;
			
			(result.title = result._.getElementsByClassName('_-listing--item--title')[0]).innerHTML = data.title; // ~EN: use innerHTML here so we can transfer over HTML entities - would be escaped in TextNode
			
			// ~EN: create text outline "shadow"
			result.title2 = result.title.cloneNode(true);
			result.title2.className += ' _-text--outline';
			result.title.parentNode.appendChild(result.title2);
			
			// category datqa
			result.cat = result._.getElementsByClassName('_-listing--item--cat')[0];
			var tmp = document.createElement('strong');
			tmp.appendChild(document.createTextNode(data.category_path ? data.category_path[0] : 'Unknown'));
			result.cat.appendChild(tmp);
			
			// price
			result.cat.appendChild(document.createTextNode(' \u2013 '));
			tmp = document.createElement('span');
			tmp.className = '_-listing--item--price';
			tmp.appendChild(document.createTextNode('$' + data.price));
			result.cat.appendChild(tmp);
			
			// content
			result.content = result._.getElementsByClassName('_-listing--item--content')[0];
			tmp = document.createElement('p');
			tmp.innerHTML = data.description;
			result.content.appendChild(tmp);
			
			// img
			result.img = result._.getElementsByClassName('_-listing--item--img')[0].getElementsByTagName('img')[0];
			result.img.src = data.Images[0].url_170x135;
						
			_.log('api[etsysearch][result][+]',result);
			
			return result;

		},
		
		/* results(array): prepare and print out all results from prior request */
		results : function(args){
			if(!args){
				return false;
			}
			
			// change page title
			if(args.type == 'err'){
				this.title(this.titles.err);
			}else if(args.type == 'empty'){
				
				var title = _.str.tokenReplace(this.str.titles.results,_.str.token('num'),'No');
				title = _.str.tokenReplace(title,_.str.token('q'),this.q);
				
				this.title(title);
			}else{
				var title = _.str.tokenReplace(this.str.titles.results,_.str.token('num'),args.data.count);
				title = _.str.tokenReplace(title,_.str.token('q'),this.q);
				this.title(title);
			}
			
			// change results state
			this.eles.results.setAttribute('data-_-state', args.type);			
			this.eles.title.innerHTML = (args.data.count === 0 ? 'No' : _.str.numberFormat(args.data.count)) + ' Result' + (args.data.count !== 1 ? 's': '') + ' Found for &ldquo;' + this.q + '&rdquo;' + (!args.data.count ? ' :(' : ':');
			
			if(!args.data.count){
				return false;
			}
			
			var result = null;
			this.eles.resultsList.innerHTML = '';
			
			// loop through results and append new result to list
			for(var i in args.data.results){
				if(!args.data.results.hasOwnProperty(i)){
					continue;
				}

				if(result = __t.makeResult(args.data.results[i])){
					__t.eles.resultsList.appendChild(result._);
				}
				
			}
			
			_.log('api[etsysearch][results]',this,args.data,args.type);
		},
		
		/* title(str): generate string for page title */
		title : function(str){
			document.title = str + this.str.titles._stub;	
		},
		
		/* url(array, bool): url abstractor so we don't hardcode URLs to use for internal/external routing
			-> most URLs are generated off of the "args.svc" property
			-> can throw any data into "args"
			-> "remote" toggles between local (hash change) or remote requests (location change) */
		url : function(args,remote){
			if(!args || !args.svc){
				return false;
			}
			
			var val = args.val ? encodeURIComponent(args.val) : '';
			
			return (!remote ? this.cfg.hashbang : '') + '/' + args.svc + '/' + val;
		}
	};
	
	// ~EN: add prototype to class */
	for(var i in __proto){
		if(__proto.hasOwnProperty(i)){
			_._.EtsySearch.prototype[i] = __proto[i];
		}
	}
	
	// ~EN: init everything -> we only really use jQuery for document.ready and some function proxying
	$(document).ready(function(){
	
		_.api.etsysearch = new _._.EtsySearch({
			cfg : {
				appName : 'EtsySearch',
				key 	: 'qbwpeyzkq805zht4ky91s9x0',
				sharedSecret : '1ts8ofw6oy'
			},
			search : {
				ele : document.getElementsByClassName('_-form _-form--search')[0].getElementsByClassName('_-form--search--q')[0],
				title : document.getElementsByClassName('_-page--title')[0],
				form : document.getElementsByClassName('_-form _-form--search')[0],
				results : document.getElementsByClassName('_-form--search--results')[0]
			}
		});
		
	});
	
})(_, jQuery);