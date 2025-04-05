/**
 * Serviço de pagamento da Cielo
 */
var dcGatewayCielo = function () {
    "use strict";

    var _self = this;

    _self.complete = function () {
        $(_self.checkoutForm).append('<input type="hidden" name="send_card" value="1">');
        $(_self.checkoutForm).append('<input type="hidden" name="cc_number" value="' + _self.creditcard.getNumber() + '">');
        $(_self.checkoutForm).append('<input type="hidden" name="cc_cvv" value="' + _self.creditcard.getCvv() + '">');

        var deferred = jQuery.Deferred();
        deferred.resolve(true);
        return deferred.promise();
    };

    return _self;
};

/**
 * Serviço de pagamento da LinxPay
 */
var dcGatewayLinxPay = function () {
    "use strict";

    var _self = this;

    _self.complete = function () {
        $(_self.checkoutForm).append('<input type="hidden" name="send_card" value="1">');
        $(_self.checkoutForm).append('<input type="hidden" name="cc_number" value="' + _self.creditcard.getNumber() + '">');
        $(_self.checkoutForm).append('<input type="hidden" name="cc_cvv" value="' + _self.creditcard.getCvv() + '">');

        var deferred = jQuery.Deferred();
        deferred.resolve(true);
        return deferred.promise();
    };

    return _self;
};

/**
 * Serviço de pagamento da MaxiPago
 */
 var dcGatewayMaxipago = function () {
    "use strict";

    var _self = this;
    // Org ID (Dev/Homolog): 1snn5n9w
    // Org ID (Produção): k8vif92e
    // Merchant ID: rede_dooca
    var orgId = window.dooca.environment === 'production' ? 'k8vif92e' : '1snn5n9w';
    var fingerPrint = 'https://h.online-metrix.net/fp/tags.js?org_id=' + orgId + '&session_id=rede_dooca-' + window.dooca.cart.token;

    _self.complete = function () {
        $(_self.checkoutForm).append('<input type="hidden" name="send_card" value="1">');
        $(_self.checkoutForm).append('<input type="hidden" name="cc_number" value="' + _self.creditcard.getNumber() + '">');
        $(_self.checkoutForm).append('<input type="hidden" name="cc_cvv" value="' + _self.creditcard.getCvv() + '">');

        var deferred = jQuery.Deferred();
        deferred.resolve(true);
        return deferred.promise();
    };

    // Quando abrir o gateway, carregar o script para gerar e enviar as info do finger
    $.getScript({
        url: fingerPrint,
        cache: true
    }).done(function () {});

    return _self;
};

/**
 * Serviço de pagamento Mercado Pago
 */
var dcGatewayMercadoPago = function () {
    'use strict';

    var _self = this;
    var _api = 'https://secure.mlstatic.com/sdk/javascript/v1/mercadopago.js';

    _self.complete = function () {
        var deferred = jQuery.Deferred();

        _self.getCardToken().done(function (response) {
            deferred.resolve(response);
        }).fail(function (errors) {
            deferred.reject(errors);
        });

        return deferred.promise();
    };

    this.getCardToken = function () {
        var deferred = jQuery.Deferred();

        // Quando apertar no finalizar.
        this.getScript().done(function () {
            var cc = Mercadopago.setPublishableKey(window.dooca.gateway.public_key);
            Mercadopago.clearSession();
            Mercadopago.createToken({
                cardNumber: _self.creditcard.getNumber(),
                securityCode: _self.creditcard.getCvv(),
                cardExpirationMonth: _self.creditcard.getMonth(),
                cardExpirationYear: _self.creditcard.getYear(),
                cardholderName: _self.creditcard.getHolder().name,
                docType: _self.creditcard.getHolder().docType,
                docNumber: _self.creditcard.getHolder().cgc.replace(/\D/g, ''),
            }, function (status, response) {
                if (status === 200) {
                    deferred.resolve({
                        token: response.id
                    });
                } else {
                    console.log('MercadoPago error:', response);
                    if (response.cause) {
                        var errors = {};
                        for (var index = 0; index < response.cause.length - 1; index++) {
                            console.log(response.cause[index].code);

                            var code = _self.getErrorName(response.cause[index].code);
                            errors[code] = code;
                        }

                        console.log('os errors do def', errors);
                        deferred.reject(['invalid_card_data']);
                    }

                    deferred.reject(['invalid_card_data']);
                }
            });
        });

        return deferred.promise();
    };

    this.getScript = function () {
        return $.getScript({
            url: _api,
            cache: true
        });
    }

    this.getScript().fail(function () {
        console.log('Fail to load gateway script');
    });

    this.getErrorName = function (error) {
        var errors = {
            '205': 'invalid_card_number',
            '208': 'invalid_card_date',
            '209': 'invalid_card_date',
            '212': 'invalid_card_holder_cgc',
            '214': 'invalid_card_holder_cgc',
            '221': 'invalid_card_holder_name',
            '224': 'invalid_card_cvv',
            'E301': 'invalid_card_number',
            'E302': 'invalid_card_cvv',
            '316': 'invalid_card_holder_name',
            '324': 'invalid_card_holder_cgc',
            '325': 'invalid_card_date',
            '326': 'invalid_card_date',
        };

        if (errors[error]) {
            return errors[error];
        }

        return 'invalid_card_data';
    };

    return _self;
}

/**
 * Service MOIP
 */
var dcGatewayMundipagg = function () {
    "use strict";

    // // private params
    var _self = this;

    this.complete = function () {
        var deferred = jQuery.Deferred();

        var cardData = {
            type: "card",
            card: {
                number: _self.creditcard.getNumber(),
                holder_name: _self.creditcard.getHolder().name,
                exp_month: _self.creditcard.getMonth(),
                exp_year: _self.creditcard.getYear(),
                cvv: _self.creditcard.getCvv()
            }
        };

        $.ajax({
            type: 'POST',
            url: 'https://api.mundipagg.com/core/v1/tokens?appId=' + window.dooca.gateway.public_key,
            contentType: "application/json",
            dataType: 'json',
            data: JSON.stringify(cardData)
        }).done(function (response) {
            deferred.resolve({
                token: response.id
            });
        }).fail(function (error) {
            console.log('error ', error);
            deferred.reject(['invalid_card_data']);
        });

        return deferred.promise();
    };

    return _self;
};

/**
 * Service 
 */
var dcGatewayPagarme = function () {
    "use strict";

    // private params
    var _self = this;
    // var _api = 'https://assets.pagar.me/pagarme-js/3.0/pagarme.min.js';
    var _api = 'https://assets.pagar.me/pagarme-js/4.11/pagarme.min.js'
    this.getCardToken = function () {
        var deferred = jQuery.Deferred();

        this.getScript().done(function () {
            var month = _self.creditcard.getMonth().length == 1 ? '0' + _self.creditcard.getMonth() : _self.creditcard.getMonth();
            var card = {
                card_holder_name: _self.creditcard.getHolder().name,
                card_expiration_date: month + _self.creditcard.getYear().slice(-2),
                card_number: _self.creditcard.getNumber(),
                card_cvv: _self.creditcard.getCvv()
            };

            var cardValidations = pagarme.validate({ card: card }).card;
            var validCard = (cardValidations.card_cvv && cardValidations.card_expiration_date && cardValidations.card_holder_name && cardValidations.card_number);

            if (validCard) {
                pagarme.client.connect({ encryption_key: window.dooca.gateway.public_key })
                    .then(function (client) {
                        client.security.encrypt(card)
                            .then(function (card_hash) {
                                // console.log(card_hash);
                                // deferred.reject(['invalid_card_data']);
                                deferred.resolve({
                                    token: card_hash
                                });
                            });
                    });
            } else {
                console.log(cardValidations);
                deferred.reject(['invalid_card_data']);
            }
        });

        return deferred.promise();
    };

    this.complete = function () {
        var deferred = jQuery.Deferred();

        _self.getCardToken().done(function (response) {
            deferred.resolve(response);
        }).fail(function (errors) {
            deferred.reject(errors);
        });

        return deferred.promise();
    };

    this.getScript = function () {
        return $.getScript(_api);
    }

    this.getScript().fail(function () {
        console.log('Fail to load gateway script');
    });

    return _self;
};

/**
 * Service Pagseguro
 */
var dcGatewayPagseguro = function () {
    "use strict";

    // private params
    var _self = this;
    var _api = {
        production: 'https://stc.pagseguro.uol.com.br/pagseguro/api/v2/checkout/pagseguro.directpayment.js',
        sandbox: 'https://stc.sandbox.pagseguro.uol.com.br/pagseguro/api/v2/checkout/pagseguro.directpayment.js'
    };

    this.getCardToken = function () {
        var deferred = jQuery.Deferred();

        this.getScript().done(function () {
            PagSeguroDirectPayment.setSessionId(window.dooca.gateway.extra.pre_order.session);

            PagSeguroDirectPayment.onSenderHashReady(function (response) {
                if (response.status == 'error') {
                    console.log('onSenderHashReady', response.message);
                    deferred.reject({});
                }

                $(_self.checkoutForm).append('<input type="hidden" name="extra[sender_hash]" value="' + response.senderHash + '">');

                // Usar o método de buscar a bandeira do cartão da Dooca
                // PagSeguroDirectPayment.getBrand({
                //     cardBin: _self.creditcard.getBin(),
                //     success: function (response) {
                //         console.log('brand found', response.brand.name);
                //         //bandeira encontrada
                //         cardBrand = response.brand.name;
                //     },
                //     error: function (response) {
                //         // Caso der erro, tentar buscar o cartão de outra forma
                //         cardBrand = _self.getCardBrand(_self.creditcard.getBrand());
                //         console.log('card error', response);
                //         //tratamento do erro
                //         // deferred.reject({});
                //     }
                // });

                PagSeguroDirectPayment.createCardToken({
                    cardNumber: _self.creditcard.getNumber(), // Número do cartão de crédito
                    brand: _self.getCardBrand(_self.creditcard.getBrand()), // Bandeira do cartão
                    cvv: _self.creditcard.getCvv(), // CVV do cartão
                    expirationMonth: _self.creditcard.getMonth(), // Mês da expiração do cartão
                    expirationYear: _self.creditcard.getYear(), // Ano da expiração do cartão, é necessário os 4 dígitos.
                    success: function (response) {
                        // Retorna o cartão tokenizado.
                        deferred.resolve({ token: response.card.token });
                    },
                    error: function (response) {
                        // Callback para chamadas que falharam.
                        deferred.reject({});
                        console.log('createCardToken', response);
                    }
                });
            });
        });

        return deferred.promise();
    };

    _self.billetExtra = function () {
        var deferred = jQuery.Deferred();

        this.getScript().done(function () {
            PagSeguroDirectPayment.setSessionId(window.dooca.gateway.extra.pre_order.session);

            PagSeguroDirectPayment.onSenderHashReady(function (response) {
                if (response.status == 'error') {
                    console.log(response.message);
                    deferred.reject({});
                }

                $(_self.checkoutForm).append('<input type="hidden" name="extra[sender_hash]" value="' + response.senderHash + '">');

                deferred.resolve({});
            });
        });


        return deferred.promise();
    }

    /**
     * Identificar que gateway é externo
     */
    _self.hasBilletExtra = function () {
        return true;
    }

    this.complete = function () {
        var deferred = jQuery.Deferred();

        _self.getCardToken().done(function (response) {
            deferred.resolve(response);
        }).fail(function (errors) {
            deferred.reject(errors);
        });

        return deferred.promise();
    };

    this.getScript = function () {
        if (window.dooca.environment === 'production') {
            return $.getScript(_api.production);
        } else {
            return $.getScript(_api.sandbox);
        }
    };

    this.getScript().fail(function () {
        console.log('Fail to load gateway script');
    });

    this.getCardBrand = function (brand) {
        switch (brand) {
            case 'elo':
                return 'elo';
            case 'visa': 
                return 'visa'
            case 'mastercard': 
                return 'mastercard'
            case 'amex': 
                return 'americanexpress'
            case 'hipercard': 
                return 'hipercard'
            case 'diners': 
                return 'diners'
            default:
                return null;
        }
    };

    return _self;
};

/**
 * Serviço de pagamento Mercado Pago
 */
var dcGatewayPaypalPlus = function () {
    'use strict';

    var _self = this;
    var _api = 'https://www.paypalobjects.com/webstatic/ppplusdcc/ppplusdcc.min.js';
    var ppp;
    var checkoutPromise = jQuery.Deferred();

    var init = function () {
        disableContinue(); // Ativar load até carregar paypal
        $(window).on('message', paypalplusEvent);


        $.getScript(_api).done(function (response) {
            var customer = window.dooca.customer;

            // Instância objeto do paypal
            ppp = PAYPAL.apps.PPP({
                approvalUrl: window.dooca.gateway.extra.pre_order.approval_url,
                mode: window.dooca.environment === 'production' ? "live" : "sandbox",
                placeholder: "ppplus",
                payerEmail: customer.email,
                payerFirstName: customer.first_name,
                payerLastName: customer.last_name,
                payerPhone: customer.phone,
                payerTaxId: customer.cgc,
                payerTaxIdType: customer.cgc.length > 11 ? "BR_CNPJ" : "BR_CPF",
                country: "BR",
                // collectBillingAddress: "",
                // css: "",
                disableContinue: disableContinue,
                enableContinue: enableContinue,
                onLoad: enableContinue,
                disallowRememberedCards: true,
                language: "pt_BR",
                merchantInstallmentSelection: 1,
                merchantInstallmentSelectionOptional: true,
                iframeHeight: 400
                // onContinue: function (tokenCartao, payerId, paymentToken) { },
                // onError: ''
                // onLoad: ""
            });

        });

        /**
         * Evento que script do paypal dispara
         * 
         * @param {object} event 
         */
        function paypalplusEvent(event) {
            console.log('paypalplusEvent', event);
            try {
                var message = JSON.parse(event.originalEvent.data);
            } catch (e) {
                return;
            }

            // Evento de checkout, que irá resolver a promise
            if (message.action == 'checkout') {
                checkoutPromise.resolve(message.result);
            } else if (message.cause) {
                console.log('reject: ', message.cause);
                // Handle error
                checkoutPromise.reject();
            }
        }

        function disableContinue() {
            var button = $('#form-checkout-complete').find('.btn-loader');
            button.prop('disabled', true);
            button.addClass('is-loading');
            $('.page-loader, .page-loader .static-loader').fadeIn();
        }

        function enableContinue() {
            var button = $('#form-checkout-complete').find('.btn-loader');
            button.prop('disabled', false);
            button.removeClass('is-loading');
            $('.page-loader, .page-loader .static-loader').fadeOut();
        }
    }

    _self.external = function () {
        var deferred = jQuery.Deferred();
        ppp.doContinue();

        // Esperar o evento do paypal ser resolvido
        checkoutPromise.promise().done(function (response) {
            // Adicionar valores para dar submit no form
            var payment_card = response.payer.funding_options[0].funding_sources[0].payment_card;
            var installments = (response.term && response.term.term) ? response.term.term : 1;

            $(_self.checkoutForm).append('<input type="hidden" name="extra[payment_id]" value="' + window.dooca.gateway.extra.pre_order.paypal_id + '">');
            $(_self.checkoutForm).append('<input type="hidden" name="extra[payer_id]" value="' + response.payer.payer_info.payer_id + '">');

            $(_self.checkoutForm).append('<input type="hidden" name="cc_brand" value="' + getCreditCardBrand(payment_card.type) + '">');
            // $(_self.checkoutForm).append('<input type="hidden" name="cc_bin" value="' + creditcard.getBin() + '">');
            $(_self.checkoutForm).append('<input type="hidden" name="installments" value="' + installments + '">');
            $(_self.checkoutForm).append('<input type="hidden" name="cc_end" value="' + payment_card.number + '">');
            $(_self.checkoutForm).append('<input type="hidden" name="cc_year" value="' + payment_card.expire_year + '">');
            $(_self.checkoutForm).append('<input type="hidden" name="cc_month" value="' + payment_card.expire_month + '">');

            console.log('resolve paypal');
            deferred.resolve({});
        }).fail(function (response) {
            console.log('reject promise paypal');
            deferred.reject({});
        });

        return deferred.promise();
    }

    /**
     * Identificar que gateway é externo
     */
    _self.isExternal = function () {
        return true;
    }

    /**
     * De/Para de cartão de crédito
     * 
     * @param {string} brand 
     */
    function getCreditCardBrand(brand) {
        // mastercard,elo,visa,americanexpress,hipercard,diners
        switch (brand) {
            case 'MASTERCARD':
                return 'mastercard';
            case 'VISA':
                return 'visa';
            case 'AMEX':
                return 'americanexpress';
            case 'ELO':
                return 'elo';
            case 'HIPERCARD':
                return 'hipercard';
            default:
                return brand;
        }
    }

    init();

    return _self;
}

/**
 * Serviço de pagamento Mercado Pago
 */
var dcGatewayPaypal = function () {
    'use strict';

    var _self = this;
    var _api = 'https://www.paypal.com/sdk/js?client-id=' + window.dooca.gateway.public_key + '&currency=BRL&locale=pt_BR';
    var _form = $('#form-checkout-complete');

    var init = function () {
        $.getScript({
            url: _api,
            cache: true
        }).done(function (response) {
            paypal.Buttons({
                style: {
                    layout: 'horizontal',
                    tagline: true,
                },
                createOrder: function () { return window.dooca.gateway.extra.pre_order.token; },
                onApprove: function (data) {
                    $(_form).append('<input type="hidden" name="extra[payment_id]" value="' + data.paymentID + '">');
                    $(_form).append('<input type="hidden" name="extra[payer_id]" value="' + data.payerID + '">');
                    $(_form).submit();
                }
            }).render('#paypal-button-container');

        });
    };

    init();

    return _self;
};
/**
 * Serviço de pagamento da Rede
 */
var dcGatewayRede = function () {
    "use strict";

    var _self = this;

    _self.complete = function () {
        $(_self.checkoutForm).append('<input type="hidden" name="send_card" value="1">');
        $(_self.checkoutForm).append('<input type="hidden" name="cc_number" value="' + _self.creditcard.getNumber() + '">');
        $(_self.checkoutForm).append('<input type="hidden" name="cc_cvv" value="' + _self.creditcard.getCvv() + '">');

        var deferred = jQuery.Deferred();
        deferred.resolve(true);
        return deferred.promise();
    };

    return _self;
};

/**
 * Service MOIP
 */
var dcGatewayWirecard = function () {
    "use strict";

    // private params
    var _self = this;
    var _api = 'https://assets.moip.com.br/v2/moip.min.js';

    this.getCardToken = function () {
        var deferred = jQuery.Deferred();

        this.getScript().done(function () {
            var cc = new Moip.CreditCard({
                number: _self.creditcard.getNumber(),
                cvc: _self.creditcard.getCvv(),
                expMonth: _self.creditcard.getMonth(),
                expYear: _self.creditcard.getYear(),
                pubKey: window.dooca.gateway.public_key
            });

            // if (cc.isValid()) {
            deferred.resolve({
                token: cc.hash()
            })
            // } else {
            //     deferred.reject(['invalid_card_data']);
            // }
        });

        return deferred.promise();
    };

    this.complete = function () {
        var deferred = jQuery.Deferred();

        _self.getCardToken().done(function (response) {
            deferred.resolve(response);
        }).fail(function (errors) {
            deferred.reject(errors);
        });

        return deferred.promise();
    };

    this.getScript = function () {
        return $.getScript(_api);
    }

    this.getScript().fail(function () {
        console.log('Fail to load gateway script');
    });

    return _self;
};

/**
 * Serviço de pagamento da Yapay
 */
var dcGatewayYapay = function () {
    "use strict";

    var _self = this;
    var fingerPrint = 'https://static.traycheckout.com.br/js/finger_print.js';

    _self.complete = function () {
        var deferred = jQuery.Deferred();

        $(_self.checkoutForm).append('<input type="hidden" name="send_card" value="1">');
        $(_self.checkoutForm).append('<input type="hidden" name="cc_number" value="' + _self.creditcard.getNumber() + '">');
        $(_self.checkoutForm).append('<input type="hidden" name="cc_cvv" value="' + _self.creditcard.getCvv() + '">');
        $(_self.checkoutForm).append('<input type="hidden" name="extra[fingerprint]" value="' + $(document).FingerPrint().getFingerPrint() + '">');

        deferred.resolve(true);

        return deferred.promise();
    }

    $.getScript({
        url: fingerPrint,
        cache: true
    }).done(function () {
        window.yapay.FingerPrint().getFingerPrint({ env: 'sandbox' });
    });

    return _self;
};

$(function () {
    "use strict";

    var targetNode = document.querySelector('body');
    var dc_checkout_parcels = $('[dc-checkout-parcels]');
    var dc_checkout_total = $('[dc-checkout-total]');
    var config = {
        attributes: true,
        childList: true,
        subtree: true
    };

    var init = function (element) {
        if ($(element).length > 0) {
            console.log($(element));
            $(element).on('change', function () {
                var total = $(this).find('option:selected').attr('data-total');
                dc_checkout_total.text(total);
            });
        }
    };

    var callback = function (mutationsList, observer) {
        for (var index = 0; index < mutationsList.length; index++) {
            if (mutationsList[index].type == 'childList') {
                var target = mutationsList[index].target;

                init($(target).find('[dc_checkout_parcels]'));
            }
        }
    };

    var observer = new MutationObserver(callback);
    observer.observe(targetNode, config);

    init(dc_checkout_parcels);
});

$(function () {
  "use strict";

  var targetNode = document.querySelector("body");
  var dc_countdown = $("[dc-countdown]");
  var date_now = new Date();
  var request = false;
  var plugin_src = window.dooca.assets_url + "/assets/js/lib/countdown.min.js";
  var config = {
    attributes: true,
    childList: true,
    subtree: true,
  };

  var mount = function (element) {
    element.each(function (index, el) {
      var date = $(el).data("countdown-end");
      var date_end = date || date_now.setHours(23, 59, 59);

      $(el)
        .countdown(date_end, function (event) {
          var day = event.strftime("%D");
          var hours = event.strftime("%H");
          var minutes = event.strftime("%M");
          var seconds = event.strftime("%S");

          $("[data-days]", this).html(day);
          $("[data-days-d]", this).html(day[0]);
          $("[data-days-u]", this).html(day[1]);

          $("[data-hours]", this).html(hours);
          $("[data-hours-d]", this).html(hours[0]);
          $("[data-hours-u]", this).html(hours[1]);

          $("[data-minutes]", this).html(minutes);
          $("[data-minutes-d]", this).html(minutes[0]);
          $("[data-minutes-u]", this).html(minutes[1]);

          $("[data-seconds]", this).html(seconds);
          $("[data-seconds-d]", this).html(seconds[0]);
          $("[data-seconds-u]", this).html(seconds[1]);

          if (day <= 0) {
            $(this).addClass("days-finished");
          }
        })
        .on("finish.countdown", function () {
          $(this).addClass("is-finished");
        });
    });
  };

  var init = function (element) {
    if ($(element).length > 0) {
      if ($("body").countdown) {
        mount(element);
      } else if (!$("body").countdown && !request) {
        $.getScript(
          plugin_src,
          function (data, status) {
            if (status == "success") {
              mount(element);
              request = true;
            }
          },
          true
        );
      }
    }
  };

  var callback = function (mutationsList, observer) {
    for (var index = 0; index < mutationsList.length; index++) {
      if (mutationsList[index].type == "childList") {
        var target = mutationsList[index].target;

        init($(target).find("[dc-countdown]"));
      }
    }
  };

  var observer = new MutationObserver(callback);
  observer.observe(targetNode, config);

  init(dc_countdown);
});


$(function () {
	"use strict";

	var dc_fixed = $('[dc-fixed]');

	if (dc_fixed.length > 0) {

		var verifyFixed = function (ele, top, scrollAtual, cb) {

			if (scrollAtual > top) {
				$(ele).addClass('is-fixed');
				// $('.main-content').css('padding-top', $(ele).find('>div').outerHeight());
			} else {
				$(ele).removeClass('is-fixed');
				// $('.main-content').css('padding-top', 0);
			}

			if (cb && window[cb]) {
				window[cb]();
			}

		};

		dc_fixed.each(function (index, ele) {
			var top = $(ele).attr('dc-fixed');
			var cb = $(ele).attr('data-callback');
			var scrollAtual = $(window).scrollTop();

			verifyFixed($(ele), top, scrollAtual, cb);

			$(window).on('scroll', function () {

				scrollAtual = $(window).scrollTop();
				verifyFixed($(ele), top, scrollAtual, cb);

			})
		});

	}
});
$(function () {
  "use strict";

  // Private method
  var _increase = function (evt, input, options, form) {
    evt.preventDefault();

    var val = Number(input.val());
    var total = "";

    if (val < options.max || !options.max) {
      total = val + 1;
      input.val(total).change();

      if (options.action == "event") {
        _formSubmit(form, input, options);
      }
    }
  };

  var _decrease = function (evt, input, options, form) {
    evt.preventDefault();

    var val = Number(input.val());
    var total = "";

    if (val > options.min) {
      total = val - 1;
      input.val(total).change();

      if (options.action == "event") {
        _formSubmit(form, input, options);
      }
    }
  };

  var _formSubmit = function (form, input, options) {
    if (input.val()) {
      form.submit();
    }
  };

  // Init plugin
  var init = function () {
    // Private variables
    var element = $("[dc-quantity]");

    if (element.length > 0) {
      element.each(function () {
        var options = $(this).data();
        var input = $("[dc-quantity-input]", this);
        var btDec = $("[dc-quantity-decrease]", this);
        var btInc = $("[dc-quantity-increase]", this);
        var loader = $("[dc-quantity-loader]", this);
        var form = $(this);
        var btSubmit = $(this).siblings("[dc-quantity-submit]");
        var current_value = input.val();

        // Validation
        var max = options.max;
        var min = options.min;
        var qtd = Number(input.val());

        // if (max == qtd) {
        // 	btInc.prop('disabled', true);
        // }

        // if (min == qtd && min != 0) {
        // 	btDec.prop('disabled', true);
        // }

        input.keyup(function (e) {
          var val = input.val();

          if (val) {
            val = Number(val);

            if (val >= options.max) {
              input.val(options.max).change();
            } else if (val <= options.min) {
              input.val(options.min).change();
            } else {
              input.val(val).change();
            }
          }
        });

        input.blur(function (e) {
          if (input.val() != current_value && options.action == "event") {
            loader.show();
            _formSubmit(form, input, options);
          }
        });

        btInc.unbind("click");
        btInc.bind("click", function (evt) {
          // loader.show();
          _increase(evt, input, options, form);
        });

        btDec.unbind("click");
        btDec.bind("click", function (evt) {
          // loader.show();
          _decrease(evt, input, options, form);
        });

        btSubmit.unbind("click");
        btSubmit.bind("click", function (evt) {
          evt.preventDefault();
          _formSubmit(form, input, options, loader);
        });

        form.on("submit", function (evt) {
          loader.show();
        });
      });
    }
  };

  init();

  // Watch for ajax
  $(document).ajaxComplete(function () {
    init();
  });
});

"use strict";

var targetNode = document.querySelector("body");
var dc_scroll = $("[dc-scroll]");
var plugin_src = window.dooca.assets_url + "/assets/js/lib/perfect-scrollbar.min.js";
var config = {
  attributes: true,
  childList: true,
  subtree: true,
};

var styles = "@import url(' " + window.dooca.assets_url + "/assets/css/lib/perfect-scrollbar.css ');";
var newSS = document.createElement("link");
newSS.rel = "stylesheet";
newSS.href = "data:text/css," + escape(styles);
document.getElementsByTagName("head")[0].appendChild(newSS);

$.ajaxSetup({
  cache: true,
});

$.getScript(
  plugin_src,
  function () {
    var init = function (element) {
      if (element.length > 0) {
        if (typeof PerfectScrollbar !== "undefined") {
          element.each(function (index, el) {
            $(el).addClass("dc-scroll");
            new PerfectScrollbar(el);
          });
        }
      }
    };

    var callback = function (mutationsList, observer) {
      for (var index = 0; index < mutationsList.length; index++) {
        if (mutationsList[index].type == "childList") {
          var target = mutationsList[index].target;
          init($(target).find("dc-scroll"));
        }
      }
    };

    var observer = new MutationObserver(callback);
    observer.observe(targetNode, config);

    init(dc_scroll);
  },
  true
);

$(function () {
  "use strict";

  var dy;
  var dc_youtube = $("[dc-youtube]");
  var plugin_src = "https://www.youtube.com/player_api";

  if (dc_youtube.length > 0) {
    $.getScript(
      plugin_src,
      function () {
        /**
         * Options default player
         */
        var videoId = $(dc_youtube).attr("dc-youtube");

        var video = {
          videoId: videoId,
          startSeconds: 0,
        };

        var playerDefaults = {
          autoplay: 0,
          autohide: 1,
          modestbranding: 0,
          rel: 0,
          showinfo: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 0,
          iv_load_policy: 3,
        };

        window.onYouTubePlayerAPIReady = function () {
          dy = new YT.Player("video", {
            events: {
              onReady: onPlayerReady,
              onStateChange: onPlayerStateChange,
            },
            playerVars: playerDefaults,
          });

          vidRescale();
        };

        window.onPlayerReady = function () {
          dy.loadVideoById(video);
          dy.mute();
        };

        window.onPlayerStateChange = function (e) {
          if (e.data === 1) {
            $(".dc-youtube .frame").addClass("active");
          } else if (e.data === 0) {
            dy.playVideo();
            dy.seekTo(0);
          }
        };

        window.vidRescale = function () {
          var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) + 250;
          var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) + 250;

          if (w / h > 16 / 9) {
            dy.setSize(w, (w / 16) * 9);
          } else {
            dy.setSize((h / 9) * 16, h);
          }
        };

        $(window).on("load resize", function () {
          vidRescale();
        });
      },
      true
    );
  }
});

(function ($) {
	$.fn.gallery = function (options) {

		var _self = this;
		var _settings = $.extend(true, {
			only_zoom: false,
			target_featured: '',
			legend: true,
			zoom: true,
			onChangeFeature: function () { },
			template: {
				modal: '<div></div>',
				modal_content: '<div></div>',
				close: '<a><i></i></a>',
				next: '<a><i></i></a>',
				prev: '<a><i></i></a>',
				counter: '<span></span>',
				counter_separator: '<span>/</span>',
				loader: '<div></div>',
				list: '<div></div>',
				item: '<div></div>',
				legend: '<div></div>',
				iframe_youtube: '<div><iframe src="//www.youtube.com/embed/{id}?rel=0&showinfo=0&vq=720" frameborder="0" allowfullscreen></iframe></div>',
				iframe_vimeo: '<div><iframe src="//www.youtube.com/embed/{id}?rel=0&showinfo=0&vq=720" frameborder="0" allowfullscreen></iframe></div>'
			}
		}, options);

		var getListZoom = function (ele) {

			var list = [];
			var zoomList = $(_settings.template.list).addClass('dc-zoom__list');

			ele.each(function (index, el) {
				var src = $(el).data('zoom');
				var alt = $(el).data('legend') || '';
				var type = $(el).data('video') ? 'video' : 'image';

				if (type === 'image') {
					var img = $('<img>').attr({
						src: src,
						alt: alt
					});
					var item = $(_settings.template.item).addClass('dc-zoom__item').append(img);
				} else if (type === 'video') {
					var video_id = $(el).attr('data-video');
					var video_type = $(el).attr('data-video-type');
					var iframe = $(getVideo(video_id, video_type)).addClass('dc-gallery__video');
					var item = $(_settings.template.item).addClass('dc-zoom__item').attr({
						'data-video': video_id
					}).append(iframe);
				}

				if (_settings.legend) {
					$(_settings.template.legend).addClass('dc-zoom__legend').append(alt).appendTo(item);
				}

				list.push(item);
			});

			zoomList.append(list);

			return zoomList;
		};

		var loadImg = function (src, cb) {

			var img = $('<img>');

			img.attr('src', src);
			img.on('load', function () {
				cb();
			});

		};

		var getVideo = function (id, type) {

			if (type === 'youtube') {
				var iframe = _settings.template.iframe_youtube.replace('{id}', id);
			} else if (type === 'vimeo') {
				var iframe = _settings.template.iframe_vimeo.replace('{id}', id);
			}

			return iframe;
		};

		var initGallery = function (ele) {

			$(_settings.target_featured).addClass('dc-gallery__featured');

			var _children = $(ele).find('[data-featured]');
			var loader = $(_settings.template.loader).addClass('dc-gallery__loader').appendTo('.dc-gallery__featured');

			// events
			$(_children).addClass('dc-gallery__item').on('click', function () {

				var index = $(this).index();
				_self.changeImg(index);

			});

			if (_settings.zoom) {
				$('.dc-gallery__featured').on('click', function () {

					var index = $('.dc-gallery__item.is-active').index();

					if (!$('.dc-zoom__modal').length) {
						initZoom(ele);
					}

					_self.open(index);

				});
			}

			_self.changeImg(0);
		};

		var initZoom = function (ele) {

			var itens = $(ele).find('[data-zoom]');
			var list = getListZoom(itens, 'zoom');
			var modal = $(_settings.template.modal).addClass('dc-zoom__modal').append(list);

			$(_settings.template.close).addClass('dc-zoom__close').appendTo(modal);
			$(_settings.template.counter).addClass('dc-zoom__counter').appendTo(modal);
			$(_settings.template.loader).addClass('dc-zoom__loader').appendTo(modal);
			$(_settings.template.next).addClass('dc-zoom__next').appendTo(modal);
			$(_settings.template.prev).addClass('dc-zoom__prev').appendTo(modal);

			$('body').append(modal);

			if (itens.length <= 1) {
				$('.dc-zoom__next, .dc-zoom__prev').hide();
			}

			// events modal
			$('.dc-zoom__modal').on('click', function () {
				var target = $(event.target).attr('class');

				if ($(event.target).hasClass('dc-zoom__modal') || $(event.target).hasClass('dc-zoom__list') || $(event.target).hasClass('dc-zoom__item')) {
					_self.close();
				}
			});

			$('.dc-zoom__prev').on('click', function () {
				_self.prev();
			});

			$('.dc-zoom__next').on('click', function () {
				_self.next();
			});

			$('.dc-zoom__close').on('click', function () {
				_self.close();
			});

			$(window).keydown(function (event) {
				if (event.keyCode == 39) {
					_self.next();
				}

				if (event.keyCode == 37) {
					_self.prev();
				}

				if (event.keyCode == 27) {
					_self.close();
				}

			});
		};

		this.next = function () {

			var active = $('.dc-zoom__item.is-active').index();
			var next = active + 1;

			if ((next + 1) <= $('.dc-zoom__item').length) {
				_self.changeImgZoom(next);
			}
		};

		this.prev = function () {

			var active = $('.dc-zoom__item.is-active').index();
			var prev = active - 1;

			if (prev >= 0) {
				_self.changeImgZoom(prev);
			}
		};

		this.changeImg = function (index) {
			$('.dc-gallery__loader').show();
			$('.dc-gallery__item').removeClass('is-active');
			$('.dc-gallery__video').remove();

			var item = $('.dc-gallery__item').eq(index);
			var type = item.attr('data-video') ? 'video' : 'image';

			if (type === 'image') {
				var src = item.attr('data-featured');
				var src_zoom = item.attr('data-zoom');
				var alt = item.attr('data-legend') || '';

				loadImg(src, function () {
					$('.dc-gallery__loader').hide();
					$('.dc-gallery__item').eq(index).addClass('is-active');

					$('.dc-gallery__featured img').attr({
						src: src,
						alt: alt
					}).show();

					var data_cb = {
						index: index,
						legend: alt,
						src: src,
						src_zoom: src_zoom
					};

					_settings.onChangeFeature(data_cb);

				});

			} else if (type === 'video') {

				var video_id = item.attr('data-video');
				var video_type = item.attr('data-video-type');
				var iframe = getVideo(video_id, video_type);

				$('.dc-gallery__featured img').hide();

				$(iframe).addClass('dc-gallery__video').appendTo('.dc-gallery__featured').show();

				$('.dc-gallery__item').eq(index).addClass('is-active');

				setTimeout(function () {
					$('.dc-gallery__loader').hide()
				}, 1000);
			}
		};

		this.changeImgZoom = function (index) {
			$('.dc-zoom__loader').show();
			$('.dc-zoom__item').hide().removeClass('is-active');

			var type = $('.dc-zoom__item').eq(index).attr('data-video') ? 'video' : 'image';
			var src = $('.dc-zoom__item').eq(index).find('img').attr('src');

			if (type == 'image') {
				loadImg(src, function () {
					$('.dc-zoom__loader').hide();
					$('.dc-zoom__item').eq(index).addClass('is-active').show();
					_self.updateCounter(index);
				});
			} else if (type == 'video') {
				$('.dc-zoom__loader').hide();
				$('.dc-zoom__item').eq(index).addClass('is-active').show();
				_self.updateCounter(index);
			}
		};

		this.updateCounter = function (index) {

			var content = (index + 1) + _settings.template.counter_separator + $('.dc-zoom__item').length;

			$('.dc-zoom__counter').html('').append(content);

		};

		this.open = function (index) {
			index = index || 0;
			$('body, html').addClass('dc-zoom--open');
			$('.dc-zoom__modal').show();

			_self.changeImgZoom(index);
			_self.updateCounter(index);
		};

		this.close = function () {
			$('.dc-zoom__modal').hide();
			$('.dc-zoom__item').hide();
			$('body, html').removeClass('dc-zoom--open');
		};

		return this.each(function () {
			var _this = this;


			if (!_settings.only_zoom) {

				initGallery(_this);

			} else {

				var _children = $(this).find('[data-zoom]');

				$(_settings.target_featured).hide();

				_children.each(function () {
					var index = $(this).index();

					$(this).on('click', function () {
						if (!$('.dc-zoom__modal').length) {
							initZoom(_this);
						}

						_self.open(index);
					});
				});
			}
		});

	}

})(jQuery);
(function ($) {
	"use strict";

	$.fn.modal = function (options) {

		var _self = this;
		var _template = '<div class="modal"><div class="modal__overlay"></div><div class="modal__container"><div class="modal__header"><div class="modal__title"></div><span class="modal__close"><i></i></span></div><div class="modal__content"></div><div class="modal__footer"></div></div></div>';

		var _settings = $.extend(true, {
			template: _template,
			class: 'modal',
			onOpen: null,
			onClose: null
		}, options);

		var _getId = function (ele) {
			var modal_class = ele.attr('class');
			var modal_id = modal_class.split(' ')[0].trim();
			return modal_id;
		};

		// var _validModal = function (id) {
		// 	var modal = $('#' + id);
		// 	return modal.length > 0 ? true : false;
		// }

		var _initModal = function (ele) {
			var id_modal = _getId(ele);
			// var modal_exist = _validModal(id_modal);

			// if (modal_exist) {
			// 	$('#' + id_modal).remove();
			// }

			var content = ele.clone(true, true);
			var modal_title = ele.attr('data-modal-title');
			var modal_footer = ele.attr('data-modal-footer');

			_self.modal = $(_settings.template).attr('id', id_modal).addClass(_settings.class);
			_self.modal.appendTo('body').hide();

			$('.modal__title', _self.modal).append(modal_title);
			$('.modal__footer', _self.modal).append(modal_footer);
			$('.modal__content', _self.modal).append(content);

			ele.remove();

			//events

			$('.modal__overlay, .modal__close').on('click', function () {
				_self.close();
			});


		};

		this.open = function (callback) {

			$('body').addClass('modal-open').css({
				'overflow': 'hidden'
			});

			var cb = callback || _settings.onOpen;

			_self.modal.fadeIn(300);

			if (cb && typeof cb === 'function') {
				setTimeout(function () {
					cb();
				}, 300);
			}

			$(window).keydown(function (event) {

				if (event.keyCode == 27) {
					_self.close();
				}

			});

		};

		this.close = function (callback) {

			$('body').removeClass('modal-open').removeAttr('style');

			var cb = callback || _settings.onClose;
			_self.modal.fadeOut(200);

			if (cb && typeof cb === 'function') {
				setTimeout(function () {
					cb();
				}, 300);
			}

		};

		return this.each(function () {

			_initModal($(this));

		});
	}

})(jQuery);
(function () {
  "use strict";

  /**
   * Serviço de Cookies
   *
   * @example Services.Cookies.get('meucookie');
   * @example Services.Cookies.set('meucookie', 'meu valor');
   * @example Services.Cookies.delete('meucookie');
   *
   * @return {Object};
   */
  _dcs.Cookies = function () {
    /**
     * Buscar um cookie
     * @param {String} sKey
     */
    function get(sKey) {
      if (!sKey) {
        return null;
      }
      return (
        decodeURIComponent(
          document.cookie.replace(
            new RegExp("(?:(?:^|.*;)\\s*" + sKey.replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"),
            "$1"
          )
        ) || null
      );
    }

    /**
     * Setar um cookie
     * @param {String} sKey
     * @param {String|Number} sValue
     * @param {Number} vEnd
     * @param {String} sPath
     * @param {String} sDomain
     * @param {Boolean} bSecure
     */
    function set(sKey, sValue, vEnd, sPath, sDomain, bSecure) {
      var sExpires = "";

      if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
        return false;
      }
      if (!!vEnd && typeof vEnd === "number") {
        sExpires = "; max-age=" + vEnd * 86400;
      } else if (vEnd !== undefined) {
        console.error("vEnd: must be of the type number, Ex: 1 year = 365,", "The object is: " + vEnd);
      }

      document.cookie =
        sKey +
        "=" +
        sValue +
        sExpires +
        (sDomain ? "; domain=" + sDomain : "") +
        (sPath ? "; path=" + sPath : "; path=/") +
        (bSecure ? "; secure" : "");

      return true;
    }

    /**
     * Deletar um cookie
     * @param {String} sKey
     * @param {String} sPath
     * @param {String} sDomain
     */
    function deleteItem(sKey, sPath, sDomain) {
      sPath = "/";
      document.cookie =
        sKey +
        "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" +
        (sDomain ? "; domain=" + sDomain : "") +
        (sPath ? "; path=" + sPath : "");
      return true;
    }

    /**
     * Verificar se existe um cookie com o key indicado
     * @param {String} sKey
     */
    function hasItem(sKey) {
      if (!sKey) {
        return false;
      }
      return new RegExp("(?:^|;\\s*)" + sKey.replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=").test(document.cookie);
    }

    /**
     * Retornas os cookies registrados
     * @returns {Array}
     */
    function keys() {
      var aKeys = document.cookie
        .replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "")
        .split(/\s*(?:\=[^;]*)?;\s*/);
      for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) {
        aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
      }
      return aKeys;
    }

    return {
      get: get,
      set: set,
      delete: deleteItem,
      hasItem: hasItem,
      keys: keys,
    };
  };
})();

(function () {
  "use strict";

  /**
   * Retornar o template do toast
   * @param {String} message
   * @param {String} type
   */
  function getTemplate(message, type) {
    if (!message || message.length <= 0) {
      console.error("Toast Service: message undefined", message);
      return false;
    }

    var classToast = type ? "toast toast--" + type : "toast";
    var template = $("<div>").addClass(classToast);
    var text = $("<span>").addClass("text").text(message);
    var icon = $("<i>").addClass("icon");
    var btnClose = $("<span>").addClass("close");

    template.append(icon, text, btnClose);

    return template;
  }

  /**
   * Remover o toast
   * @param {HTMLElement} toast
   */
  function removeToast(toast) {
    $(toast).removeClass("is-open");

    setTimeout(function () {
      $(toast).remove();
    }, 300);
  }

  /**
   * Mostrar o toast para o usuário
   * @param {String} message
   * @param {String} type
   * @param {Number} timeout
   */
  function open(message, type, timeout, delay) {
    delay = delay || 0;
    timeout = timeout || 0;

    if ($(".toast__container").length <= 0) {
      $("<div>").addClass("toast__container").appendTo("body");
    }

    setTimeout(function () {
      var toast = getTemplate(message, type);
      $(toast).appendTo(".toast__container").addClass("is-open");

      if (timeout > 0) {
        setTimeout(function () {
          removeToast(toast);
        }, timeout);
      }
    }, delay);
  }

  $("body")
    .off()
    .on("click", ".toast .close", function () {
      var toast = $(this).parent(".toast");

      removeToast(toast);
    });

  _dcs.toast = {
    close: function (toast) {
      removeToast(toast);
    },
    success: function (message, timeout, delay) {
      open(message, "success", timeout, delay);
    },
    danger: function (message, timeout, delay) {
      open(message, "danger", timeout, delay);
    },
    warning: function (message, timeout, delay) {
      open(message, "warning", timeout, delay);
    },
    info: function (message, timeout, delay) {
      open(message, "info", timeout, delay);
    },
  };
})();

$(function () {
	"use strict";

	var _setCookie = function (value) {
		var cookieService = new _dcs.Cookies();
		var cookieName = '_dc_utm_campaign';

		return cookieService.set(cookieName, value);
	};
	var _init = function () {
		var search = window.location.search;
		var utm = {
			utm_campaign: null,
			utm_medium: null,
			utm_source: null,
		};

		if (search) {
			var searchObj = {};
			search.replace('?', '').split('&').forEach(function (item, index) {
				var keyValue = item.split('=');
				searchObj[(keyValue[0] || item)] = (keyValue[1] || true);
			});

			if (searchObj.utm_campaign || searchObj.utm_medium || searchObj.utm_source) {
				utm.utm_campaign = searchObj.utm_campaign || null;
				utm.utm_medium = searchObj.utm_medium || null;
				utm.utm_source = searchObj.utm_source || null;

				_setCookie(JSON.stringify(utm));
				console.log('utm', utm);
			}
		}
	}

	_init();
});

(function () {
  "use strict";

  /*
   * Service xhr/ajax
   * @see http://api.jquery.com/jquery.ajax/
   *
   * @example
   * 	var ajax = new _dcs.Xhr({url});
   * 	quando o {url} não for enviado a url do ajax assumirá o link da página atual
   *
   * 	ajax.get({
   * 		id: '{name-do-ajax}'
   * 	}).done(function(data) {
   * 		console.log(data)
   * 	});
   *
   * @param {String} url url para request
   * @return {Object} objeto com os metodos do service
   */
  _dcs.Xhr = function (url) {
    /**
     * Normalizar os param para o request $ajax
     * @param {String} method
     * @param {Object} params
     */
    var normalizeRequest = function (method, params) {
      var id = params.id || true;
      var extendedHeaders = params.headers || {};
      var xAjax = {"X-Ajax": id};
      var headers = Object.assign(xAjax, extendedHeaders);

      params = $.extend(
        {
          method: method || "GET",
          cache: false,
          headers,
          url,
          data: {
            ajax: id,
          },
        },
        params
      );

      return params;
    };

    /**
     * Enviar requisição via ajax
     * @param {String} method
     * @param {Object} params
     * @return {Promise} $ajax
     */
    function request(method, params) {
      params = normalizeRequest(method, params);
      return $.ajax(params);
    }

    return {
      get: function (params) {
        return request("GET", params);
      },
      post: function (params) {
        return request("POST", params);
      },
      put: function (params) {
        return request("PUT", params);
      },
    };
  };
})();
