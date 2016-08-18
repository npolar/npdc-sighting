#!/usr/bin/env ruby
# http requests to submit or receive json documents from
# a document database.
#
#
# Author: srldl
#
#################################################################

require 'net/http'

module Couch

  class Server

    def initialize(host, port, options = nil)
     @host = host
     @port = port
     @options = options
    end

    def delete(uri)
      request(Net::HTTP::Delete.new(uri))
    end

    def get(uri)
      #request(Net::HTTP::Get.new(uri))
      req = Net::HTTP::Get.new(uri)
      request(req)
    end

    def put(uri, json)
      req = Net::HTTP::Put.new(uri, user, password)
      req["content-type"] = "application/json; charset=utf-8"
      req["username"] = user
      req['password'] = password
      req.body = json
      request(req)
    end

    def post(uri, json, user, password)
      req = Net::HTTP::Post.new(uri)
      req["content-type"] = "application/json; charset=utf-8"
      req["username"] = user
      req['password'] = password
      req.body = json
      request(req)
    end

    def request(req)
      res = Net::HTTP.start(@host, @port) { |http| http.request(req) }
      unless res.kind_of?(Net::HTTPSuccess)
           handle_error(req, res)
      end
      res
    end

  private

  def handle_error(req, res)
      e = RuntimeError.new("#{res.code}:#{res.message}\nMETHOD:#{req.method}\nURI:#{req.path}\n#{res.body}")
      raise e
  end


 end
end
